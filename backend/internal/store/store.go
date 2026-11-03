// Package store keeps users, email codes and sessions in memory and mirrors
// them to a JSON file so accounts survive restarts. Swap for Postgres later.
package store

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/taxi-project/backend/internal/models"
)

var ErrNotFound = errors.New("not found")

type snapshot struct {
	Users         map[string]models.User              `json:"users"`
	Codes         map[string]models.EmailCode         `json:"codes"`
	Sessions      map[string]models.Session           `json:"sessions"`
	Applications  map[string]models.DriverApplication `json:"applications"`
	AdminSessions map[string]models.AdminSession      `json:"adminSessions"`
}

type Store struct {
	mu   sync.RWMutex
	path string
	data snapshot
}

func Open(path string) (*Store, error) {
	s := &Store{
		path: path,
		data: snapshot{
			Users:         map[string]models.User{},
			Codes:         map[string]models.EmailCode{},
			Sessions:      map[string]models.Session{},
			Applications:  map[string]models.DriverApplication{},
			AdminSessions: map[string]models.AdminSession{},
		},
	}

	raw, err := os.ReadFile(path)
	if errors.Is(err, os.ErrNotExist) {
		return s, nil
	}
	if err != nil {
		return nil, err
	}
	if err := json.Unmarshal(raw, &s.data); err != nil {
		return nil, err
	}
	// Files written before a collection existed decode it as nil.
	if s.data.Applications == nil {
		s.data.Applications = map[string]models.DriverApplication{}
	}
	if s.data.AdminSessions == nil {
		s.data.AdminSessions = map[string]models.AdminSession{}
	}
	return s, nil
}

func (s *Store) persist() error {
	if err := os.MkdirAll(filepath.Dir(s.path), 0o700); err != nil {
		return err
	}
	raw, err := json.MarshalIndent(s.data, "", "  ")
	if err != nil {
		return err
	}
	tmp := s.path + ".tmp"
	if err := os.WriteFile(tmp, raw, 0o600); err != nil {
		return err
	}
	return os.Rename(tmp, s.path)
}

func codeKey(email string, purpose models.CodePurpose) string {
	return string(purpose) + ":" + email
}

func (s *Store) UserByEmail(email string) (models.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, user := range s.data.Users {
		if user.Email == email {
			return user, nil
		}
	}
	return models.User{}, ErrNotFound
}

func (s *Store) UserByID(id string) (models.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	user, ok := s.data.Users[id]
	if !ok {
		return models.User{}, ErrNotFound
	}
	return user, nil
}

func (s *Store) SaveUser(user models.User) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data.Users[user.ID] = user
	return s.persist()
}

func (s *Store) Code(email string, purpose models.CodePurpose) (models.EmailCode, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	code, ok := s.data.Codes[codeKey(email, purpose)]
	if !ok {
		return models.EmailCode{}, ErrNotFound
	}
	return code, nil
}

func (s *Store) SaveCode(code models.EmailCode) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data.Codes[codeKey(code.Email, code.Purpose)] = code
	return s.persist()
}

func (s *Store) DeleteCode(email string, purpose models.CodePurpose) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.data.Codes, codeKey(email, purpose))
	return s.persist()
}

func (s *Store) SaveSession(session models.Session) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data.Sessions[session.TokenHash] = session
	return s.persist()
}

func (s *Store) Session(tokenHash string) (models.Session, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	session, ok := s.data.Sessions[tokenHash]
	if !ok || time.Now().After(session.ExpiresAt) {
		return models.Session{}, ErrNotFound
	}
	return session, nil
}

func (s *Store) DeleteSession(tokenHash string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.data.Sessions, tokenHash)
	return s.persist()
}

func (s *Store) DeleteUserSessions(userID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for hash, session := range s.data.Sessions {
		if session.UserID == userID {
			delete(s.data.Sessions, hash)
		}
	}
	return s.persist()
}
