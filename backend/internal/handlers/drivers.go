package handlers

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/taxi-project/backend/internal/models"
	"github.com/taxi-project/backend/internal/services"
)

// Eight photos plus JSON; each photo is capped separately by the service.
var maxApplicationBytes = int64(len(models.DocumentSlots))*services.MaxDocumentBytes + (1 << 20)

type DriverHandler struct {
	drivers *services.DriverService
}

func NewDriverHandler(drivers *services.DriverService) *DriverHandler {
	return &DriverHandler{drivers: drivers}
}

func (h *DriverHandler) Register(mux *http.ServeMux) {
	mux.HandleFunc("POST /driver/applications", h.submit)
	mux.HandleFunc("GET /driver/applications/{id}", h.status)
}

func (h *DriverHandler) submit(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxApplicationBytes)
	if err := r.ParseMultipartForm(16 << 20); err != nil {
		writeError(w, &services.AppError{Status: 400, Code: "invalid_form", Message: "Upload must be multipart/form-data under the size limit."})
		return
	}
	defer r.MultipartForm.RemoveAll()

	var in services.ApplicationInput
	if err := json.Unmarshal([]byte(r.FormValue("data")), &in); err != nil {
		writeError(w, &services.AppError{Status: 400, Code: "invalid_json", Message: "Field \"data\" must be valid JSON."})
		return
	}

	app, err := h.drivers.Submit(in, func(slot string) (io.ReadCloser, error) {
		file, _, err := r.FormFile(slot)
		return file, err
	})
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]models.ApplicationStatusView{"application": app.StatusView()})
}

func (h *DriverHandler) status(w http.ResponseWriter, r *http.Request) {
	view, err := h.drivers.Status(r.PathValue("id"))
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]models.ApplicationStatusView{"application": view})
}
