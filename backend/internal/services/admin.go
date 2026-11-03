package services

import (
	"context"
	"crypto/subtle"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/taxi-project/backend/internal/mailer"
	"github.com/taxi-project/backend/internal/models"
	"github.com/taxi-project/backend/internal/store"
)

const (
	adminSessionTTL   = 12 * time.Hour
	maxAdminFailures  = 5
	adminLockout      = 10 * time.Minute
	maxReviewNoteSize = 500
)

type AdminService struct {
	email    string
	password string
	store    *store.Store
	mailer   mailer.Mailer

	mu          sync.Mutex
	failures    int
	lockedUntil time.Time
}

func NewAdminService(email, password string, st *store.Store, m mailer.Mailer) *AdminService {
	if email == "" || password == "" {
		log.Println("admin: ADMIN_EMAIL / ADMIN_PASSWORD not set — admin sign-in is disabled")
	}
	return &AdminService{
		email:    normalizeEmail(email),
		password: password,
		store:    st,
		mailer:   m,
	}
}

type AdminSessionResult struct {
	Token string `json:"token"`
	Email string `json:"email"`
}

func (s *AdminService) Login(email, password string) (AdminSessionResult, error) {
	if s.email == "" || s.password == "" {
		return AdminSessionResult{}, newErr(503, "admin_disabled", "Admin sign-in is not configured on the server.")
	}

	s.mu.Lock()
	if time.Now().Before(s.lockedUntil) {
		wait := int(time.Until(s.lockedUntil).Seconds()) + 1
		s.mu.Unlock()
		return AdminSessionResult{}, &AppError{Status: 429, Code: "too_many_attempts", Message: "Too many attempts. Try again later.", RetryAfter: wait}
	}
	s.mu.Unlock()

	emailOK := subtle.ConstantTimeCompare([]byte(normalizeEmail(email)), []byte(s.email)) == 1
	passwordOK := subtle.ConstantTimeCompare([]byte(password), []byte(s.password)) == 1
	if !emailOK || !passwordOK {
		s.mu.Lock()
		s.failures++
		if s.failures >= maxAdminFailures {
			s.lockedUntil = time.Now().Add(adminLockout)
			s.failures = 0
		}
		s.mu.Unlock()
		return AdminSessionResult{}, errInvalidCredentials
	}

	s.mu.Lock()
	s.failures = 0
	s.mu.Unlock()

	token, err := randomToken()
	if err != nil {
		return AdminSessionResult{}, err
	}
	err = s.store.SaveAdminSession(models.AdminSession{
		TokenHash: hashSecret(token),
		Email:     s.email,
		ExpiresAt: time.Now().Add(adminSessionTTL),
	})
	if err != nil {
		return AdminSessionResult{}, err
	}
	return AdminSessionResult{Token: token, Email: s.email}, nil
}

func (s *AdminService) Authenticate(token string) (models.AdminSession, error) {
	if token == "" {
		return models.AdminSession{}, errUnauthorized
	}
	session, err := s.store.AdminSession(hashSecret(token))
	if err != nil {
		return models.AdminSession{}, errUnauthorized
	}
	return session, nil
}

func (s *AdminService) Logout(token string) error {
	return s.store.DeleteAdminSession(hashSecret(token))
}

type ApplicationCounts struct {
	Total    int `json:"total"`
	Pending  int `json:"pending"`
	Approved int `json:"approved"`
	Rejected int `json:"rejected"`
}

type AdminStats struct {
	Riders         int                        `json:"riders"`
	VerifiedRiders int                        `json:"verifiedRiders"`
	NewRiders7d    int                        `json:"newRiders7d"`
	Applications   ApplicationCounts          `json:"applications"`
	RecentPending  []models.DriverApplication `json:"recentPending"`
}

func (s *AdminService) Stats() AdminStats {
	weekAgo := time.Now().Add(-7 * 24 * time.Hour)
	var stats AdminStats

	for _, user := range s.store.Users() {
		stats.Riders++
		if user.EmailVerified {
			stats.VerifiedRiders++
		}
		if user.CreatedAt.After(weekAgo) {
			stats.NewRiders7d++
		}
	}

	apps := s.store.Applications()
	stats.Applications = countApplications(apps)
	stats.RecentPending = []models.DriverApplication{}
	for _, app := range apps {
		if app.Status == models.ApplicationPending && len(stats.RecentPending) < 5 {
			stats.RecentPending = append(stats.RecentPending, app)
		}
	}
	return stats
}

func countApplications(apps []models.DriverApplication) ApplicationCounts {
	counts := ApplicationCounts{Total: len(apps)}
	for _, app := range apps {
		switch app.Status {
		case models.ApplicationPending:
			counts.Pending++
		case models.ApplicationApproved:
			counts.Approved++
		case models.ApplicationRejected:
			counts.Rejected++
		}
	}
	return counts
}

type ApplicationList struct {
	Items  []models.DriverApplication `json:"items"`
	Counts ApplicationCounts          `json:"counts"`
}

func (s *AdminService) Applications(status, query string) ApplicationList {
	all := s.store.Applications()
	query = strings.ToLower(strings.TrimSpace(query))

	items := []models.DriverApplication{}
	for _, app := range all {
		if status != "" && string(app.Status) != status {
			continue
		}
		if query != "" && !matchesApplication(app, query) {
			continue
		}
		items = append(items, app)
	}
	return ApplicationList{Items: items, Counts: countApplications(all)}
}

func matchesApplication(app models.DriverApplication, query string) bool {
	haystack := strings.ToLower(strings.Join([]string{
		app.FirstName + " " + app.LastName,
		app.Email,
		app.Phone,
		app.Vehicle.Plate,
		app.Vehicle.Make + " " + app.Vehicle.Model,
	}, " "))
	return strings.Contains(haystack, query)
}

func (s *AdminService) Application(id string) (models.DriverApplication, error) {
	app, err := s.store.Application(id)
	if err != nil {
		return models.DriverApplication{}, newErr(404, "not_found", "Application not found.")
	}
	return app, nil
}

func (s *AdminService) Review(ctx context.Context, id, reviewer string, approve bool, note string) (models.DriverApplication, error) {
	app, err := s.Application(id)
	if err != nil {
		return models.DriverApplication{}, err
	}
	if app.Status != models.ApplicationPending {
		return models.DriverApplication{}, newErr(409, "already_reviewed", "This application has already been reviewed.")
	}

	note = strings.TrimSpace(note)
	if len(note) > maxReviewNoteSize {
		return models.DriverApplication{}, newErr(400, "note_too_long", "Keep the note under 500 characters.")
	}
	if !approve && note == "" {
		return models.DriverApplication{}, newErr(400, "note_required", "Tell the applicant why the application was rejected.")
	}

	now := time.Now().UTC()
	app.Status = models.ApplicationApproved
	if !approve {
		app.Status = models.ApplicationRejected
	}
	app.ReviewedAt = &now
	app.ReviewedBy = reviewer
	app.ReviewNote = note

	if err := s.store.SaveApplication(app); err != nil {
		return models.DriverApplication{}, err
	}

	if err := s.mailer.Send(ctx, decisionEmail(app)); err != nil {
		log.Printf("admin: decision email to %s failed: %v", app.Email, err)
	}
	return app, nil
}

func (s *AdminService) Users(query string) []models.PublicUser {
	query = strings.ToLower(strings.TrimSpace(query))
	users := []models.PublicUser{}
	for _, user := range s.store.Users() {
		if query != "" {
			haystack := strings.ToLower(user.FirstName + " " + user.LastName + " " + user.Email + " " + user.Phone)
			if !strings.Contains(haystack, query) {
				continue
			}
		}
		users = append(users, user.Public())
	}
	return users
}
