package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID `json:"id" db:"id"`
	Email        string    `json:"email" db:"email"`
	PasswordHash string    `json:"-" db:"password_hash"`
	Name         string    `json:"name" db:"name"`
	Role         string    `json:"role" db:"role"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

type CreateUserRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name" binding:"required"`
	Role     string `json:"role" binding:"required,oneof=author editor admin coordinator"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
	Role     string `json:"role" binding:"required,oneof=author editor admin coordinator"`
}

type LoginResponse struct {
	User  User   `json:"user"`
	Token string `json:"token"`
}

type UpdateUserRequest struct {
	Name string `json:"name" binding:"required"`
	Role string `json:"role" binding:"required,oneof=author editor admin coordinator"`
}

func (u *User) IsRole(role string) bool {
	return u.Role == role
}

func (u *User) IsAuthor() bool {
	return u.Role == "author"
}

func (u *User) IsEditor() bool {
	return u.Role == "editor"
}

func (u *User) IsAdmin() bool {
	return u.Role == "admin"
}

func (u *User) IsCoordinator() bool {
	return u.Role == "coordinator"
}
