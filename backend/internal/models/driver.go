package models

import "time"

type ApplicationStatus string

const (
	ApplicationPending  ApplicationStatus = "pending_review"
	ApplicationApproved ApplicationStatus = "approved"
	ApplicationRejected ApplicationStatus = "rejected"
)

// DocumentSlots are the photos every driver application must include.
var DocumentSlots = []string{
	"profilePhoto",
	"licensePhoto",
	"registration",
	"insurance",
	"exteriorFront",
	"exteriorRear",
	"interiorFront",
	"interiorRear",
}

type Vehicle struct {
	Make  string `json:"make"`
	Model string `json:"model"`
	Year  string `json:"year"`
	Color string `json:"color"`
	Plate string `json:"plate"`
}

type DriverApplication struct {
	ID          string            `json:"id"`
	Status      ApplicationStatus `json:"status"`
	FirstName   string            `json:"firstName"`
	LastName    string            `json:"lastName"`
	Email       string            `json:"email"`
	Phone       string            `json:"phone"`
	DateOfBirth string            `json:"dateOfBirth"`
	// Only the last four digits are ever stored; the full SSN goes to the background-check provider.
	SSNLast4    string            `json:"ssnLast4"`
	Address     Address           `json:"address"`
	Vehicle     Vehicle           `json:"vehicle"`
	Documents   map[string]string `json:"documents"`
	SubmittedAt time.Time         `json:"submittedAt"`
	ReviewedAt  *time.Time        `json:"reviewedAt,omitempty"`
	ReviewedBy  string            `json:"reviewedBy,omitempty"`
	ReviewNote  string            `json:"reviewNote,omitempty"`
}

// ApplicationStatusView is what the applicant's phone may read back.
type ApplicationStatusView struct {
	ID          string            `json:"id"`
	Status      ApplicationStatus `json:"status"`
	SubmittedAt time.Time         `json:"submittedAt"`
	ReviewedAt  *time.Time        `json:"reviewedAt,omitempty"`
	ReviewNote  string            `json:"reviewNote,omitempty"`
}

func (a DriverApplication) StatusView() ApplicationStatusView {
	return ApplicationStatusView{
		ID:          a.ID,
		Status:      a.Status,
		SubmittedAt: a.SubmittedAt,
		ReviewedAt:  a.ReviewedAt,
		ReviewNote:  a.ReviewNote,
	}
}

type AdminSession struct {
	TokenHash string    `json:"tokenHash"`
	Email     string    `json:"email"`
	ExpiresAt time.Time `json:"expiresAt"`
}
