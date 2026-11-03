package models

import "time"

type Address struct {
	Street string `json:"street"`
	Unit   string `json:"unit,omitempty"`
	City   string `json:"city"`
	State  string `json:"state"`
	Zip    string `json:"zip"`
}

type User struct {
	ID             string    `json:"id"`
	FirstName      string    `json:"firstName"`
	LastName       string    `json:"lastName"`
	Email          string    `json:"email"`
	Phone          string    `json:"phone"`
	BillingAddress Address   `json:"billingAddress"`
	EmailVerified  bool      `json:"emailVerified"`
	CreatedAt      time.Time `json:"createdAt"`
	PasswordHash   string    `json:"passwordHash"`
}

// Public is the shape returned to clients — never includes the password hash.
type PublicUser struct {
	ID             string    `json:"id"`
	FirstName      string    `json:"firstName"`
	LastName       string    `json:"lastName"`
	Email          string    `json:"email"`
	Phone          string    `json:"phone"`
	BillingAddress Address   `json:"billingAddress"`
	EmailVerified  bool      `json:"emailVerified"`
	CreatedAt      time.Time `json:"createdAt"`
}

func (u User) Public() PublicUser {
	return PublicUser{
		ID:             u.ID,
		FirstName:      u.FirstName,
		LastName:       u.LastName,
		Email:          u.Email,
		Phone:          u.Phone,
		BillingAddress: u.BillingAddress,
		EmailVerified:  u.EmailVerified,
		CreatedAt:      u.CreatedAt,
	}
}

type CodePurpose string

const (
	PurposeVerifyEmail   CodePurpose = "verify_email"
	PurposeResetPassword CodePurpose = "reset_password"
)

type EmailCode struct {
	Email     string      `json:"email"`
	Purpose   CodePurpose `json:"purpose"`
	CodeHash  string      `json:"codeHash"`
	ExpiresAt time.Time   `json:"expiresAt"`
	SentAt    time.Time   `json:"sentAt"`
	Attempts  int         `json:"attempts"`
}

type Session struct {
	TokenHash string    `json:"tokenHash"`
	UserID    string    `json:"userId"`
	ExpiresAt time.Time `json:"expiresAt"`
}
