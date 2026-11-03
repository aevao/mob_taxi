package store

import (
	"sort"
	"time"

	"github.com/taxi-project/backend/internal/models"
)

// Users returns every account, newest first.
func (s *Store) Users() []models.User {
	s.mu.RLock()
	defer s.mu.RUnlock()
	users := make([]models.User, 0, len(s.data.Users))
	for _, user := range s.data.Users {
		users = append(users, user)
	}
	sort.Slice(users, func(i, j int) bool {
		return users[i].CreatedAt.After(users[j].CreatedAt)
	})
	return users
}

// Applications returns every driver application, newest first.
func (s *Store) Applications() []models.DriverApplication {
	s.mu.RLock()
	defer s.mu.RUnlock()
	apps := make([]models.DriverApplication, 0, len(s.data.Applications))
	for _, app := range s.data.Applications {
		apps = append(apps, app)
	}
	sort.Slice(apps, func(i, j int) bool {
		return apps[i].SubmittedAt.After(apps[j].SubmittedAt)
	})
	return apps
}

func (s *Store) Application(id string) (models.DriverApplication, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	app, ok := s.data.Applications[id]
	if !ok {
		return models.DriverApplication{}, ErrNotFound
	}
	return app, nil
}

func (s *Store) SaveApplication(app models.DriverApplication) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data.Applications[app.ID] = app
	return s.persist()
}

func (s *Store) SaveAdminSession(session models.AdminSession) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data.AdminSessions[session.TokenHash] = session
	return s.persist()
}

func (s *Store) AdminSession(tokenHash string) (models.AdminSession, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	session, ok := s.data.AdminSessions[tokenHash]
	if !ok || time.Now().After(session.ExpiresAt) {
		return models.AdminSession{}, ErrNotFound
	}
	return session, nil
}

func (s *Store) DeleteAdminSession(tokenHash string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.data.AdminSessions, tokenHash)
	return s.persist()
}
