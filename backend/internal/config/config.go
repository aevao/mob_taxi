package config

import (
	"bufio"
	"os"
	"strings"
	"time"
)

type Config struct {
	Port          string
	DataFile      string
	UploadsDir    string
	AdminEmail    string
	AdminPassword string
	MailFrom      string
	SMTPHost      string
	SMTPPort      string
	SMTPUser      string
	SMTPPassword  string
	ResendAPIKey  string
	// LogCodes prints verification codes to the server log (dev only).
	LogCodes    bool
	CodeTTL     time.Duration
	ResendAfter time.Duration
	SessionTTL  time.Duration
}

func Load() Config {
	loadDotEnv(".env")

	smtpUser := env("SMTP_USER", "")
	// Gmail shows app passwords in groups of four ("abcd efgh ijkl mnop").
	smtpPassword := strings.ReplaceAll(env("SMTP_PASSWORD", ""), " ", "")
	resendKey := env("RESEND_API_KEY", "")

	defaultFrom := "WHYP Taxi <onboarding@resend.dev>"
	if smtpUser != "" {
		defaultFrom = "WHYP Taxi <" + smtpUser + ">"
	}
	hasMailer := (smtpUser != "" && smtpPassword != "") || resendKey != ""

	return Config{
		Port:          env("PORT", "8080"),
		DataFile:      env("DATA_FILE", "data/store.json"),
		UploadsDir:    env("UPLOADS_DIR", "data/uploads"),
		AdminEmail:    env("ADMIN_EMAIL", ""),
		AdminPassword: env("ADMIN_PASSWORD", ""),
		MailFrom:      env("MAIL_FROM", defaultFrom),
		SMTPHost:      env("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:      env("SMTP_PORT", "587"),
		SMTPUser:      smtpUser,
		SMTPPassword:  smtpPassword,
		ResendAPIKey:  resendKey,
		LogCodes:      env("LOG_CODES", "") == "true" || !hasMailer,
		CodeTTL:       10 * time.Minute,
		ResendAfter:   60 * time.Second,
		SessionTTL:    30 * 24 * time.Hour,
	}
}

func env(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok && value != "" {
		return value
	}
	return fallback
}

// loadDotEnv sets KEY=VALUE pairs from a file without overriding real env vars.
func loadDotEnv(path string) {
	file, err := os.Open(path)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, value, found := strings.Cut(line, "=")
		if !found {
			continue
		}
		key = strings.TrimSpace(key)
		value = strings.Trim(strings.TrimSpace(value), `"'`)
		if _, exists := os.LookupEnv(key); !exists {
			_ = os.Setenv(key, value)
		}
	}
}
