package services

import (
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/taxi-project/backend/internal/models"
	"github.com/taxi-project/backend/internal/store"
)

const MaxDocumentBytes = 12 << 20

var (
	usDate   = regexp.MustCompile(`^(0[1-9]|1[0-2])/(0[1-9]|[12]\d|3[01])/(19|20)\d{2}$`)
	last4    = regexp.MustCompile(`^\d{4}$`)
	appIDRe  = regexp.MustCompile(`^app_[a-f0-9]{20}$`)
	imageExt = map[string]string{
		"image/jpeg": ".jpg",
		"image/png":  ".png",
		"image/webp": ".webp",
	}
)

type ApplicationInput struct {
	FirstName   string         `json:"firstName"`
	LastName    string         `json:"lastName"`
	Email       string         `json:"email"`
	Phone       string         `json:"phone"`
	DateOfBirth string         `json:"dateOfBirth"`
	SSNLast4    string         `json:"ssnLast4"`
	Address     models.Address `json:"address"`
	Vehicle     models.Vehicle `json:"vehicle"`
}

// DocumentSource opens one uploaded photo; the HTTP layer adapts multipart files to it.
type DocumentSource func(slot string) (io.ReadCloser, error)

type DriverService struct {
	store      *store.Store
	uploadsDir string
}

func NewDriverService(st *store.Store, uploadsDir string) *DriverService {
	return &DriverService{store: st, uploadsDir: uploadsDir}
}

func (s *DriverService) Submit(in ApplicationInput, open DocumentSource) (models.DriverApplication, error) {
	in.FirstName = strings.TrimSpace(in.FirstName)
	in.LastName = strings.TrimSpace(in.LastName)
	in.Email = normalizeEmail(in.Email)
	in.Vehicle.Plate = strings.ToUpper(strings.TrimSpace(in.Vehicle.Plate))

	switch {
	case in.FirstName == "" || in.LastName == "":
		return models.DriverApplication{}, newErr(400, "invalid_name", "First and last name are required.")
	case !validEmail(in.Email):
		return models.DriverApplication{}, newErr(400, "invalid_email", "Enter a valid email address.")
	case !e164US.MatchString(in.Phone):
		return models.DriverApplication{}, newErr(400, "invalid_phone", "Enter a valid US phone number.")
	case !usDate.MatchString(in.DateOfBirth):
		return models.DriverApplication{}, newErr(400, "invalid_dob", "Date of birth must be MM/DD/YYYY.")
	case !last4.MatchString(in.SSNLast4):
		return models.DriverApplication{}, newErr(400, "invalid_ssn", "SSN is incomplete.")
	case strings.TrimSpace(in.Address.Street) == "" ||
		strings.TrimSpace(in.Address.City) == "" ||
		len(in.Address.State) != 2 ||
		!zipRegex.MatchString(in.Address.Zip):
		return models.DriverApplication{}, newErr(400, "invalid_address", "Enter a complete home address.")
	case in.Vehicle.Make == "" || in.Vehicle.Model == "" || in.Vehicle.Year == "" ||
		in.Vehicle.Color == "" || len(in.Vehicle.Plate) < 2:
		return models.DriverApplication{}, newErr(400, "invalid_vehicle", "Vehicle details are incomplete.")
	}

	for _, existing := range s.store.Applications() {
		if existing.Email != in.Email {
			continue
		}
		switch existing.Status {
		case models.ApplicationPending:
			return models.DriverApplication{}, newErr(409, "application_exists", "You already have an application in review.")
		case models.ApplicationApproved:
			return models.DriverApplication{}, newErr(409, "already_driver", "This email is already approved to drive.")
		}
	}

	token, err := randomToken()
	if err != nil {
		return models.DriverApplication{}, err
	}
	app := models.DriverApplication{
		ID:          "app_" + token[:20],
		Status:      models.ApplicationPending,
		FirstName:   in.FirstName,
		LastName:    in.LastName,
		Email:       in.Email,
		Phone:       in.Phone,
		DateOfBirth: in.DateOfBirth,
		SSNLast4:    in.SSNLast4,
		Address:     in.Address,
		Vehicle:     in.Vehicle,
		Documents:   map[string]string{},
		SubmittedAt: time.Now().UTC(),
	}

	dir := filepath.Join(s.uploadsDir, app.ID)
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return models.DriverApplication{}, err
	}
	for _, slot := range models.DocumentSlots {
		name, err := s.saveDocument(dir, slot, open)
		if err != nil {
			_ = os.RemoveAll(dir)
			return models.DriverApplication{}, err
		}
		app.Documents[slot] = name
	}

	if err := s.store.SaveApplication(app); err != nil {
		_ = os.RemoveAll(dir)
		return models.DriverApplication{}, err
	}
	return app, nil
}

func (s *DriverService) saveDocument(dir, slot string, open DocumentSource) (string, error) {
	file, err := open(slot)
	if err != nil {
		return "", newErr(400, "missing_document", "Missing photo: "+slot+".")
	}
	defer file.Close()

	data, err := io.ReadAll(io.LimitReader(file, MaxDocumentBytes+1))
	if err != nil {
		return "", err
	}
	if len(data) > MaxDocumentBytes {
		return "", newErr(413, "document_too_large", "Each photo must be under 12 MB.")
	}
	ext, ok := imageExt[http.DetectContentType(data)]
	if !ok {
		return "", newErr(400, "invalid_document", "Photos must be JPEG, PNG or WebP.")
	}

	name := slot + ext
	if err := os.WriteFile(filepath.Join(dir, name), data, 0o600); err != nil {
		return "", err
	}
	return name, nil
}

func (s *DriverService) Status(id string) (models.ApplicationStatusView, error) {
	if !appIDRe.MatchString(id) {
		return models.ApplicationStatusView{}, newErr(404, "not_found", "Application not found.")
	}
	app, err := s.store.Application(id)
	if err != nil {
		return models.ApplicationStatusView{}, newErr(404, "not_found", "Application not found.")
	}
	return app.StatusView(), nil
}

// DocumentPath resolves a stored photo; slot names are whitelisted so the path can't escape.
func (s *DriverService) DocumentPath(id, slot string) (string, error) {
	app, err := s.store.Application(id)
	if err != nil {
		return "", newErr(404, "not_found", "Application not found.")
	}
	name, ok := app.Documents[slot]
	if !ok {
		return "", newErr(404, "not_found", "Document not found.")
	}
	return filepath.Join(s.uploadsDir, app.ID, name), nil
}
