package main

import (
	"log"
	"net/http"
	"time"

	"github.com/taxi-project/backend/internal/config"
	"github.com/taxi-project/backend/internal/handlers"
	"github.com/taxi-project/backend/internal/mailer"
	"github.com/taxi-project/backend/internal/services"
	"github.com/taxi-project/backend/internal/store"
)

func main() {
	cfg := config.Load()

	st, err := store.Open(cfg.DataFile)
	if err != nil {
		log.Fatalf("store: %v", err)
	}

	mail := mailer.New(mailer.Config{
		From:         cfg.MailFrom,
		SMTPHost:     cfg.SMTPHost,
		SMTPPort:     cfg.SMTPPort,
		SMTPUser:     cfg.SMTPUser,
		SMTPPassword: cfg.SMTPPassword,
		ResendAPIKey: cfg.ResendAPIKey,
	})
	auth := services.NewAuthService(cfg, st, mail)
	drivers := services.NewDriverService(st, cfg.UploadsDir)
	admin := services.NewAdminService(cfg.AdminEmail, cfg.AdminPassword, st, mail)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok","service":"taxi-api"}`))
	})
	handlers.NewAuthHandler(auth).Register(mux)
	handlers.NewDriverHandler(drivers).Register(mux)
	handlers.NewAdminHandler(admin, drivers).Register(mux)

	server := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           withCORS(withLogging(mux)),
		ReadHeaderTimeout: 10 * time.Second,
	}

	log.Printf("Taxi API listening on :%s", cfg.Port)
	if err := server.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}

func withLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start).Round(time.Millisecond))
	})
}

// withCORS allows the Expo web build and the admin panel to call the API during development.
func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
