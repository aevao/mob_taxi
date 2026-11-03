package handlers

import (
	"net/http"

	"github.com/taxi-project/backend/internal/models"
	"github.com/taxi-project/backend/internal/services"
)

type AdminHandler struct {
	admin   *services.AdminService
	drivers *services.DriverService
}

func NewAdminHandler(admin *services.AdminService, drivers *services.DriverService) *AdminHandler {
	return &AdminHandler{admin: admin, drivers: drivers}
}

type adminHandlerFunc func(w http.ResponseWriter, r *http.Request, session models.AdminSession)

func (h *AdminHandler) Register(mux *http.ServeMux) {
	mux.HandleFunc("POST /admin/login", h.login)
	mux.HandleFunc("POST /admin/logout", h.logout)
	mux.HandleFunc("GET /admin/me", h.protect(h.me))
	mux.HandleFunc("GET /admin/stats", h.protect(h.stats))
	mux.HandleFunc("GET /admin/applications", h.protect(h.applications))
	mux.HandleFunc("GET /admin/applications/{id}", h.protect(h.application))
	mux.HandleFunc("POST /admin/applications/{id}/approve", h.protect(h.approve))
	mux.HandleFunc("POST /admin/applications/{id}/reject", h.protect(h.reject))
	mux.HandleFunc("GET /admin/applications/{id}/documents/{slot}", h.protect(h.document))
	mux.HandleFunc("GET /admin/users", h.protect(h.users))
}

func (h *AdminHandler) protect(next adminHandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		session, err := h.admin.Authenticate(bearerToken(r))
		if err != nil {
			writeError(w, err)
			return
		}
		next(w, r, session)
	}
}

func (h *AdminHandler) login(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !decode(w, r, &in) {
		return
	}
	result, err := h.admin.Login(in.Email, in.Password)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *AdminHandler) logout(w http.ResponseWriter, r *http.Request) {
	if token := bearerToken(r); token != "" {
		if err := h.admin.Logout(token); err != nil {
			writeError(w, err)
			return
		}
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *AdminHandler) me(w http.ResponseWriter, _ *http.Request, session models.AdminSession) {
	writeJSON(w, http.StatusOK, map[string]string{"email": session.Email})
}

func (h *AdminHandler) stats(w http.ResponseWriter, _ *http.Request, _ models.AdminSession) {
	writeJSON(w, http.StatusOK, h.admin.Stats())
}

func (h *AdminHandler) applications(w http.ResponseWriter, r *http.Request, _ models.AdminSession) {
	query := r.URL.Query()
	writeJSON(w, http.StatusOK, h.admin.Applications(query.Get("status"), query.Get("q")))
}

func (h *AdminHandler) application(w http.ResponseWriter, r *http.Request, _ models.AdminSession) {
	app, err := h.admin.Application(r.PathValue("id"))
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]models.DriverApplication{"application": app})
}

func (h *AdminHandler) approve(w http.ResponseWriter, r *http.Request, session models.AdminSession) {
	h.review(w, r, session, true)
}

func (h *AdminHandler) reject(w http.ResponseWriter, r *http.Request, session models.AdminSession) {
	h.review(w, r, session, false)
}

func (h *AdminHandler) review(w http.ResponseWriter, r *http.Request, session models.AdminSession, approve bool) {
	var in struct {
		Note string `json:"note"`
	}
	if r.ContentLength != 0 && !decode(w, r, &in) {
		return
	}
	app, err := h.admin.Review(r.Context(), r.PathValue("id"), session.Email, approve, in.Note)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]models.DriverApplication{"application": app})
}

func (h *AdminHandler) document(w http.ResponseWriter, r *http.Request, _ models.AdminSession) {
	path, err := h.drivers.DocumentPath(r.PathValue("id"), r.PathValue("slot"))
	if err != nil {
		writeError(w, err)
		return
	}
	w.Header().Set("Cache-Control", "private, no-store")
	http.ServeFile(w, r, path)
}

func (h *AdminHandler) users(w http.ResponseWriter, r *http.Request, _ models.AdminSession) {
	writeJSON(w, http.StatusOK, map[string][]models.PublicUser{"items": h.admin.Users(r.URL.Query().Get("q"))})
}
