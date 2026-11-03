package services

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"math/big"
	"net/mail"
	"regexp"
	"strings"
	"sync"
	"time"
	"unicode"

	"golang.org/x/crypto/bcrypt"

	"github.com/taxi-project/backend/internal/config"
	"github.com/taxi-project/backend/internal/mailer"
	"github.com/taxi-project/backend/internal/models"
	"github.com/taxi-project/backend/internal/store"
)

const (
	maxCodeAttempts  = 5
	maxLoginFailures = 8
	loginLockout     = 15 * time.Minute
)

var (
	e164US   = regexp.MustCompile(`^\+1[2-9]\d{2}[2-9]\d{6}$`)
	zipRegex = regexp.MustCompile(`^\d{5}$`)
)

// AppError carries an HTTP status and a stable machine-readable code for the client.
type AppError struct {
	Status     int
	Code       string
	Message    string
	RetryAfter int
}

func (e *AppError) Error() string { return e.Code + ": " + e.Message }

func newErr(status int, code, message string) *AppError {
	return &AppError{Status: status, Code: code, Message: message}
}

var (
	errInvalidCredentials = newErr(401, "invalid_credentials", "Email or password is incorrect.")
	errInvalidCode        = newErr(400, "invalid_code", "That code is incorrect.")
	errCodeExpired        = newErr(400, "code_expired", "This code has expired. Request a new one.")
	errTooManyAttempts    = newErr(429, "too_many_attempts", "Too many incorrect attempts. Request a new code.")
	errUnauthorized       = newErr(401, "unauthorized", "Please sign in again.")
)

type RegisterInput struct {
	FirstName      string         `json:"firstName"`
	LastName       string         `json:"lastName"`
	Email          string         `json:"email"`
	Phone          string         `json:"phone"`
	Password       string         `json:"password"`
	BillingAddress models.Address `json:"billingAddress"`
}

type AuthResult struct {
	Token string            `json:"token"`
	User  models.PublicUser `json:"user"`
}

type loginFailures struct {
	count       int
	lockedUntil time.Time
}

type AuthService struct {
	cfg       config.Config
	store     *store.Store
	mailer    mailer.Mailer
	dummyHash []byte
	mu        sync.Mutex
	failures  map[string]*loginFailures
}

func NewAuthService(cfg config.Config, st *store.Store, m mailer.Mailer) *AuthService {
	dummy, _ := bcrypt.GenerateFromPassword([]byte("whyp-timing-guard"), bcrypt.DefaultCost)
	return &AuthService{
		cfg:       cfg,
		store:     st,
		mailer:    m,
		dummyHash: dummy,
		failures:  map[string]*loginFailures{},
	}
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func validEmail(email string) bool {
	addr, err := mail.ParseAddress(email)
	return err == nil && addr.Address == email && strings.Contains(email, ".")
}

func passwordProblem(password string) string {
	if len(password) < 8 {
		return "Password must be at least 8 characters."
	}
	var hasLetter, hasDigit bool
	for _, r := range password {
		hasLetter = hasLetter || unicode.IsLetter(r)
		hasDigit = hasDigit || unicode.IsDigit(r)
	}
	if !hasLetter || !hasDigit {
		return "Password needs at least one letter and one number."
	}
	return ""
}

func hashSecret(value string) string {
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}

func randomCode() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(1_000_000))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

func randomToken() (string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return hex.EncodeToString(buf), nil
}

func (s *AuthService) Register(ctx context.Context, in RegisterInput) (string, error) {
	email := normalizeEmail(in.Email)
	in.FirstName = strings.TrimSpace(in.FirstName)
	in.LastName = strings.TrimSpace(in.LastName)

	switch {
	case in.FirstName == "" || in.LastName == "":
		return "", newErr(400, "invalid_name", "First and last name are required.")
	case !validEmail(email):
		return "", newErr(400, "invalid_email", "Enter a valid email address.")
	case !e164US.MatchString(in.Phone):
		return "", newErr(400, "invalid_phone", "Enter a valid US phone number.")
	case strings.TrimSpace(in.BillingAddress.Street) == "" ||
		strings.TrimSpace(in.BillingAddress.City) == "" ||
		len(in.BillingAddress.State) != 2 ||
		!zipRegex.MatchString(in.BillingAddress.Zip):
		return "", newErr(400, "invalid_address", "Enter a complete billing address.")
	}
	if problem := passwordProblem(in.Password); problem != "" {
		return "", newErr(400, "weak_password", problem)
	}

	existing, err := s.store.UserByEmail(email)
	if err == nil && existing.EmailVerified {
		return "", newErr(409, "email_taken", "An account with this email already exists.")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}

	user := models.User{
		ID:             existing.ID,
		FirstName:      in.FirstName,
		LastName:       in.LastName,
		Email:          email,
		Phone:          in.Phone,
		BillingAddress: in.BillingAddress,
		PasswordHash:   string(hash),
		CreatedAt:      time.Now().UTC(),
	}
	if user.ID == "" {
		id, err := randomToken()
		if err != nil {
			return "", err
		}
		user.ID = "usr_" + id[:20]
	}
	if err := s.store.SaveUser(user); err != nil {
		return "", err
	}

	if err := s.sendCode(ctx, user, models.PurposeVerifyEmail, false); err != nil {
		return "", err
	}
	return email, nil
}

func (s *AuthService) VerifyEmail(email, code string) (AuthResult, error) {
	email = normalizeEmail(email)
	user, err := s.store.UserByEmail(email)
	if err != nil {
		return AuthResult{}, errInvalidCode
	}
	if err := s.checkCode(email, models.PurposeVerifyEmail, code); err != nil {
		return AuthResult{}, err
	}

	user.EmailVerified = true
	if err := s.store.SaveUser(user); err != nil {
		return AuthResult{}, err
	}
	return s.startSession(user)
}

func (s *AuthService) ResendCode(ctx context.Context, email string, purpose models.CodePurpose) error {
	email = normalizeEmail(email)
	user, err := s.store.UserByEmail(email)
	if err != nil {
		// Same response whether or not the account exists.
		return nil
	}
	if purpose == models.PurposeVerifyEmail && user.EmailVerified {
		return nil
	}
	return s.sendCode(ctx, user, purpose, true)
}

func (s *AuthService) Login(ctx context.Context, email, password string) (AuthResult, error) {
	email = normalizeEmail(email)
	if err := s.checkLockout(email); err != nil {
		return AuthResult{}, err
	}

	user, err := s.store.UserByEmail(email)
	if err != nil {
		// Burn comparable time so response timing doesn't reveal unknown emails.
		_ = bcrypt.CompareHashAndPassword(s.dummyHash, []byte(password))
		s.recordFailure(email)
		return AuthResult{}, errInvalidCredentials
	}
	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)) != nil {
		s.recordFailure(email)
		return AuthResult{}, errInvalidCredentials
	}
	s.clearFailures(email)

	if !user.EmailVerified {
		if err := s.sendCode(ctx, user, models.PurposeVerifyEmail, false); err != nil {
			return AuthResult{}, err
		}
		return AuthResult{}, newErr(403, "email_not_verified", "Confirm your email to continue. We sent you a new code.")
	}
	return s.startSession(user)
}

func (s *AuthService) ForgotPassword(ctx context.Context, email string) error {
	email = normalizeEmail(email)
	if !validEmail(email) {
		return newErr(400, "invalid_email", "Enter a valid email address.")
	}
	user, err := s.store.UserByEmail(email)
	if err != nil {
		return nil
	}
	return s.sendCode(ctx, user, models.PurposeResetPassword, false)
}

func (s *AuthService) ResetPassword(email, code, newPassword string) (AuthResult, error) {
	email = normalizeEmail(email)
	if problem := passwordProblem(newPassword); problem != "" {
		return AuthResult{}, newErr(400, "weak_password", problem)
	}
	user, err := s.store.UserByEmail(email)
	if err != nil {
		return AuthResult{}, errInvalidCode
	}
	if err := s.checkCode(email, models.PurposeResetPassword, code); err != nil {
		return AuthResult{}, err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return AuthResult{}, err
	}
	user.PasswordHash = string(hash)
	// Receiving the code proves ownership of the inbox.
	user.EmailVerified = true
	if err := s.store.SaveUser(user); err != nil {
		return AuthResult{}, err
	}
	if err := s.store.DeleteUserSessions(user.ID); err != nil {
		return AuthResult{}, err
	}
	s.clearFailures(email)
	return s.startSession(user)
}

func (s *AuthService) Authenticate(token string) (models.User, error) {
	if token == "" {
		return models.User{}, errUnauthorized
	}
	session, err := s.store.Session(hashSecret(token))
	if err != nil {
		return models.User{}, errUnauthorized
	}
	user, err := s.store.UserByID(session.UserID)
	if err != nil {
		return models.User{}, errUnauthorized
	}
	return user, nil
}

func (s *AuthService) Logout(token string) error {
	return s.store.DeleteSession(hashSecret(token))
}

func (s *AuthService) startSession(user models.User) (AuthResult, error) {
	token, err := randomToken()
	if err != nil {
		return AuthResult{}, err
	}
	err = s.store.SaveSession(models.Session{
		TokenHash: hashSecret(token),
		UserID:    user.ID,
		ExpiresAt: time.Now().Add(s.cfg.SessionTTL),
	})
	if err != nil {
		return AuthResult{}, err
	}
	return AuthResult{Token: token, User: user.Public()}, nil
}

// sendCode issues a fresh code. With strict=true a resend inside the cooldown
// is an error; otherwise the still-valid previous code is kept silently.
func (s *AuthService) sendCode(ctx context.Context, user models.User, purpose models.CodePurpose, strict bool) error {
	if existing, err := s.store.Code(user.Email, purpose); err == nil {
		wait := time.Until(existing.SentAt.Add(s.cfg.ResendAfter))
		if wait > 0 && time.Now().Before(existing.ExpiresAt) {
			if !strict {
				return nil
			}
			return &AppError{
				Status:     429,
				Code:       "resend_too_soon",
				Message:    "Please wait before requesting another code.",
				RetryAfter: int(wait.Seconds()) + 1,
			}
		}
	}

	code, err := randomCode()
	if err != nil {
		return err
	}
	now := time.Now()
	err = s.store.SaveCode(models.EmailCode{
		Email:     user.Email,
		Purpose:   purpose,
		CodeHash:  hashSecret(user.Email + ":" + code),
		ExpiresAt: now.Add(s.cfg.CodeTTL),
		SentAt:    now,
	})
	if err != nil {
		return err
	}

	if s.cfg.LogCodes {
		log.Printf("auth: %s code for %s is %s", purpose, user.Email, code)
	}

	msg := codeEmail(user.FirstName, user.Email, code, purpose, s.cfg.CodeTTL)
	if err := s.mailer.Send(ctx, msg); err != nil {
		log.Printf("auth: failed to send %s email to %s: %v", purpose, user.Email, err)
		return newErr(502, "email_failed", "We couldn't send the email. Try again in a moment.")
	}
	return nil
}

func (s *AuthService) checkCode(email string, purpose models.CodePurpose, code string) error {
	stored, err := s.store.Code(email, purpose)
	if err != nil {
		return errInvalidCode
	}
	if time.Now().After(stored.ExpiresAt) {
		_ = s.store.DeleteCode(email, purpose)
		return errCodeExpired
	}
	if stored.Attempts >= maxCodeAttempts {
		return errTooManyAttempts
	}

	given := hashSecret(email + ":" + strings.TrimSpace(code))
	if subtle.ConstantTimeCompare([]byte(given), []byte(stored.CodeHash)) != 1 {
		stored.Attempts++
		_ = s.store.SaveCode(stored)
		if stored.Attempts >= maxCodeAttempts {
			return errTooManyAttempts
		}
		return errInvalidCode
	}
	return s.store.DeleteCode(email, purpose)
}

func (s *AuthService) checkLockout(email string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	entry, ok := s.failures[email]
	if !ok || time.Now().After(entry.lockedUntil) {
		return nil
	}
	return &AppError{
		Status:     429,
		Code:       "too_many_attempts",
		Message:    "Too many sign-in attempts. Try again later or reset your password.",
		RetryAfter: int(time.Until(entry.lockedUntil).Seconds()) + 1,
	}
}

func (s *AuthService) recordFailure(email string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	entry, ok := s.failures[email]
	if !ok {
		entry = &loginFailures{}
		s.failures[email] = entry
	}
	entry.count++
	if entry.count >= maxLoginFailures {
		entry.lockedUntil = time.Now().Add(loginLockout)
		entry.count = 0
	}
}

func (s *AuthService) clearFailures(email string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.failures, email)
}

// IsAppError unwraps an AppError for the HTTP layer.
func IsAppError(err error) (*AppError, bool) {
	var appErr *AppError
	ok := errors.As(err, &appErr)
	return appErr, ok
}
