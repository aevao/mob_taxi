package mailer

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

type Message struct {
	To      string
	Subject string
	Text    string
	HTML    string
}

type Mailer interface {
	Send(ctx context.Context, msg Message) error
}

type Config struct {
	From         string
	SMTPHost     string
	SMTPPort     string
	SMTPUser     string
	SMTPPassword string
	ResendAPIKey string
}

// New picks SMTP when credentials are set, then Resend, then the console.
func New(cfg Config) Mailer {
	switch {
	case cfg.SMTPUser != "" && cfg.SMTPPassword != "":
		log.Printf("mailer: sending via SMTP %s as %s", cfg.SMTPHost, cfg.SMTPUser)
		return &smtpMailer{
			host:     cfg.SMTPHost,
			port:     cfg.SMTPPort,
			user:     cfg.SMTPUser,
			password: cfg.SMTPPassword,
			from:     cfg.From,
		}
	case cfg.ResendAPIKey != "":
		log.Println("mailer: sending via Resend")
		return &resendMailer{
			apiKey: cfg.ResendAPIKey,
			from:   cfg.From,
			client: &http.Client{Timeout: 10 * time.Second},
		}
	default:
		log.Println("mailer: no SMTP or Resend credentials — emails are printed to the console")
		return consoleMailer{}
	}
}

type consoleMailer struct{}

func (consoleMailer) Send(_ context.Context, msg Message) error {
	log.Printf("mailer: [console] to=%s subject=%q\n%s", msg.To, msg.Subject, msg.Text)
	return nil
}

type resendMailer struct {
	apiKey string
	from   string
	client *http.Client
}

func (m *resendMailer) Send(ctx context.Context, msg Message) error {
	body, err := json.Marshal(map[string]any{
		"from":    m.from,
		"to":      []string{msg.To},
		"subject": msg.Subject,
		"text":    msg.Text,
		"html":    msg.HTML,
	})
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.resend.com/emails", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+m.apiKey)
	req.Header.Set("Content-Type", "application/json")

	res, err := m.client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode >= 300 {
		detail, _ := io.ReadAll(io.LimitReader(res.Body, 2048))
		return fmt.Errorf("resend: %s: %s", res.Status, detail)
	}
	return nil
}
