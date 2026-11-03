package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/taxi-project/backend/internal/models"
	"github.com/taxi-project/backend/internal/services"
)

const maxBodyBytes = 64 << 10

type AuthHandler struct {
	auth *services.AuthService
}

func NewAuthHandler(auth *services.AuthService) *AuthHandler {
	return &AuthHandler{auth: auth}
}

func (h *AuthHandler) Register(mux *http.ServeMux) {
	mux.HandleFunc("POST /auth/register", h.register)
	mux.HandleFunc("POST /auth/verify-email", h.verifyEmail)
	mux.HandleFunc("POST /auth/resend-code", h.resendCode)
	mux.HandleFunc("POST /auth/login", h.login)
	mux.HandleFunc("POST /auth/forgot-password", h.forgotPassword)
	mux.HandleFunc("POST /auth/reset-password", h.resetPassword)
	mux.HandleFunc("POST /auth/logout", h.logout)
	mux.HandleFunc("GET /me", h.me)
}

func (h *AuthHandler) register(w http.ResponseWriter, r *http.Request) {
	var in services.RegisterInput
	if !decode(w, r, &in) {
		return
	}
	email, err := h.auth.Register(r.Context(), in)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]string{"email": email})
}

func (h *AuthHandler) verifyEmail(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Email string `json:"email"`
		Code  string `json:"code"`
	}
	if !decode(w, r, &in) {
		return
	}
	result, err := h.auth.VerifyEmail(in.Email, in.Code)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *AuthHandler) resendCode(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Email   string             `json:"email"`
		Purpose models.CodePurpose `json:"purpose"`
	}
	if !decode(w, r, &in) {
		return
	}
	if in.Purpose != models.PurposeVerifyEmail && in.Purpose != models.PurposeResetPassword {
		writeError(w, &services.AppError{Status: 400, Code: "invalid_purpose", Message: "Unknown code purpose."})
		return
	}
	if err := h.auth.ResendCode(r.Context(), in.Email, in.Purpose); err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"sent": true})
}

func (h *AuthHandler) login(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !decode(w, r, &in) {
		return
	}
	result, err := h.auth.Login(r.Context(), in.Email, in.Password)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *AuthHandler) forgotPassword(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Email string `json:"email"`
	}
	if !decode(w, r, &in) {
		return
	}
	if err := h.auth.ForgotPassword(r.Context(), in.Email); err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"sent": true})
}

func (h *AuthHandler) resetPassword(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Email    string `json:"email"`
		Code     string `json:"code"`
		Password string `json:"password"`
	}
	if !decode(w, r, &in) {
		return
	}
	result, err := h.auth.ResetPassword(in.Email, in.Code, in.Password)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *AuthHandler) logout(w http.ResponseWriter, r *http.Request) {
	if token := bearerToken(r); token != "" {
		if err := h.auth.Logout(token); err != nil {
			writeError(w, err)
			return
		}
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *AuthHandler) me(w http.ResponseWriter, r *http.Request) {
	user, err := h.auth.Authenticate(bearerToken(r))
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]models.PublicUser{"user": user.Public()})
}

func bearerToken(r *http.Request) string {
	header := r.Header.Get("Authorization")
	token, found := strings.CutPrefix(header, "Bearer ")
	if !found {
		return ""
	}
	return strings.TrimSpace(token)
}

func decode(w http.ResponseWriter, r *http.Request, dst any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		writeError(w, &services.AppError{Status: 400, Code: "invalid_json", Message: "Request body must be valid JSON."})
		return false
	}
	return true
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func writeError(w http.ResponseWriter, err error) {
	appErr, ok := services.IsAppError(err)
	if !ok {
		log.Printf("internal error: %v", err)
		appErr = &services.AppError{Status: 500, Code: "internal", Message: "Something went wrong. Try again."}
	}
	if appErr.RetryAfter > 0 {
		w.Header().Set("Retry-After", strconv.Itoa(appErr.RetryAfter))
	}
	body := map[string]any{"code": appErr.Code, "message": appErr.Message}
	if appErr.RetryAfter > 0 {
		body["retryAfter"] = appErr.RetryAfter
	}
	writeJSON(w, appErr.Status, map[string]any{"error": body})
}
