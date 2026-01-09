package api

import (
	"context"
	"fmt"
	"math/rand"
	"net/http"
	"time"

	"rpms-backend/internal/auth"
	"rpms-backend/internal/config"
	"rpms-backend/internal/database"
	"rpms-backend/internal/email"
	"rpms-backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type Server struct {
	db          *database.Database
	jwtManager  *auth.JWTManager
	config      *config.Config
	emailSender *email.EmailSender
}

func NewServer(db *database.Database, cfg *config.Config) *Server {
	return &Server{
		db:          db,
		jwtManager:  auth.NewJWTManager(cfg),
		config:      cfg,
		emailSender: email.NewEmailSender(cfg),
	}
}

// Auth Handlers
// Auth Handlers
func (s *Server) Register(c *gin.Context) {
	var req models.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Hash password
	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Generate 6-digit verification code
	// Using a simple random number generator
	rand.Seed(time.Now().UnixNano())
	code := fmt.Sprintf("%06d", rand.Intn(1000000))

	// Create user
	user := models.User{
		Email:            req.Email,
		PasswordHash:     hashedPassword,
		Name:             req.Name,
		Role:             "author",                 // Force role to author for public registration
		Avatar:           "",                       // Default
		Bio:              "",                       // Default
		Preferences:      map[string]interface{}{}, // Default
		IsVerified:       false,
		VerificationCode: code,
		// Author Profile Fields
		AcademicYear:   req.AcademicYear,
		AuthorType:     req.AuthorType,
		AuthorCategory: req.AuthorCategory,
		AcademicRank:   req.AcademicRank,
		Qualification:  req.Qualification,
		EmploymentType: req.EmploymentType,
		Gender:         req.Gender,
	}

	ctx := c.Request.Context()
	query := `
		INSERT INTO users (
			email, password_hash, name, role, avatar, bio, preferences, is_verified, verification_code,
			academic_year, author_type, author_category, academic_rank, qualification, employment_type, gender
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
		RETURNING id, email, name, role, avatar, bio, preferences, is_verified, created_at, updated_at
	`

	err = s.db.Pool.QueryRow(ctx, query,
		user.Email, user.PasswordHash, user.Name, user.Role, user.Avatar, user.Bio, user.Preferences, user.IsVerified, user.VerificationCode,
		user.AcademicYear, user.AuthorType, user.AuthorCategory, user.AcademicRank, user.Qualification, user.EmploymentType, user.Gender,
	).Scan(
		&user.ID, &user.Email, &user.Name, &user.Role, &user.Avatar, &user.Bio, &user.Preferences, &user.IsVerified, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		// Check for unique constraint violation on email
		// This is a simplification, ideally check err code
		c.JSON(http.StatusConflict, gin.H{"error": "User with this email already exists"})
		return
	}

	// Send verification email
	go func() {
		err := s.emailSender.SendVerificationEmail(user.Email, user.VerificationCode)
		if err != nil {
			fmt.Printf("Failed to send verification email: %v\n", err)
		}
	}()

	// Log verification code to console (Mock Email Service) - KEEPING FOR DEV
	fmt.Printf("==================================================\n")
	fmt.Printf("EMAIL VERIFICATION FOR %s\n", user.Email)
	fmt.Printf("CODE: %s\n", user.VerificationCode)
	fmt.Printf("==================================================\n")

	c.JSON(http.StatusCreated, gin.H{
		"message": "Registration successful. Please check your email for the verification code.",
		"email":   user.Email,
	})
}

func (s *Server) VerifyEmail(c *gin.Context) {
	var req models.VerifyEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	var user models.User

	// Check if user exists and code matches
	query := `
		SELECT id, email, password_hash, name, role, avatar, bio, preferences, created_at, updated_at
		FROM users
		WHERE email = $1 AND verification_code = $2
	`

	err := s.db.Pool.QueryRow(ctx, query, req.Email, req.Code).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.Role, &user.Avatar, &user.Bio, &user.Preferences, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid verification code or email"})
		return
	}

	// Update user as verified and clear code
	updateQuery := `
		UPDATE users
		SET is_verified = TRUE, verification_code = ''
		WHERE id = $1
	`
	_, err = s.db.Pool.Exec(ctx, updateQuery, user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify user"})
		return
	}

	user.IsVerified = true

	// Generate JWT token
	token, err := s.jwtManager.GenerateToken(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	response := models.LoginResponse{
		User:  user,
		Token: token,
	}

	c.JSON(http.StatusOK, response)
}

func (s *Server) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	var user models.User

	query := `
		SELECT id, email, password_hash, name, role, avatar, bio, preferences, created_at, updated_at
		FROM users
		WHERE email = $1
	`

	err := s.db.Pool.QueryRow(ctx, query, req.Email).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.Role, &user.Avatar, &user.Bio, &user.Preferences, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Check password
	if !auth.CheckPassword(req.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Generate JWT token
	token, err := s.jwtManager.GenerateToken(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	response := models.LoginResponse{
		User:  user,
		Token: token,
	}

	c.JSON(http.StatusOK, response)
}

func (s *Server) GetProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")

	ctx := c.Request.Context()
	var user models.User

	query := `
		SELECT id, email, name, role, avatar, bio, preferences, created_at, updated_at
		FROM users
		WHERE id = $1
	`

	err := s.db.Pool.QueryRow(ctx, query, userID).Scan(
		&user.ID, &user.Email, &user.Name, &user.Role, &user.Avatar, &user.Bio, &user.Preferences, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (s *Server) UpdateProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")
	id, err := uuid.Parse(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req models.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	query := `
		UPDATE users
		SET name = $1, avatar = $2, bio = $3, preferences = $4, updated_at = NOW()
		WHERE id = $5
		RETURNING id, email, name, role, avatar, bio, preferences, created_at, updated_at
	`

	var user models.User
	err = s.db.Pool.QueryRow(ctx, query, req.Name, req.Avatar, req.Bio, req.Preferences, id).Scan(
		&user.ID, &user.Email, &user.Name, &user.Role, &user.Avatar, &user.Bio, &user.Preferences, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (s *Server) ChangePassword(c *gin.Context) {
	userID, _ := c.Get("user_id")
	id, err := uuid.Parse(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req models.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()

	// Get current password hash
	var currentHash string
	err = s.db.Pool.QueryRow(ctx, "SELECT password_hash FROM users WHERE id = $1", id).Scan(&currentHash)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Verify old password
	if !auth.CheckPassword(req.OldPassword, currentHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid old password"})
		return
	}

	// Hash new password
	newHash, err := auth.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash new password"})
		return
	}

	// Update password
	_, err = s.db.Pool.Exec(ctx, "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", newHash, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
}

func (s *Server) DeleteAccount(c *gin.Context) {
	userID, _ := c.Get("user_id")
	id, err := uuid.Parse(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	ctx := c.Request.Context()
	_, err = s.db.Pool.Exec(ctx, "DELETE FROM users WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete account"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Account deleted successfully"})
}

func (s *Server) GetNotifications(c *gin.Context) {
	userID, _ := c.Get("user_id")
	id, err := uuid.Parse(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	ctx := c.Request.Context()
	query := `
		SELECT id, user_id, message, is_read, created_at, paper_id
		FROM notifications
		WHERE user_id = $1
		ORDER BY created_at DESC
	`

	rows, err := s.db.Pool.Query(ctx, query, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notifications"})
		return
	}
	defer rows.Close()

	var notifications []models.Notification
	for rows.Next() {
		var n models.Notification
		err := rows.Scan(&n.ID, &n.UserID, &n.Message, &n.IsRead, &n.CreatedAt, &n.PaperID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan notification"})
			return
		}
		notifications = append(notifications, n)
	}

	c.JSON(http.StatusOK, notifications)
}

func (s *Server) MarkNotificationRead(c *gin.Context) {
	notificationID := c.Param("id")
	userID, _ := c.Get("user_id")

	ctx := c.Request.Context()
	query := `
		UPDATE notifications
		SET is_read = true
		WHERE id = $1 AND user_id = $2
	`

	_, err := s.db.Pool.Exec(ctx, query, notificationID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark notification as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification marked as read"})
}

// Paper Handlers
func (s *Server) GetPapers(c *gin.Context) {
	ctx := c.Request.Context()

	query := `
		SELECT p.id, p.title, p.abstract, p.content, p.file_url, p.author_id, p.status, p.created_at, p.updated_at,
			   p.institution_code, p.publication_id, p.publication_isced_band, p.publication_title_amharic,
			   p.publication_date, p.publication_type, p.journal_type, p.journal_name, p.indigenous_knowledge,
			   u.name as author_name, u.email as author_email
		FROM papers p
		LEFT JOIN users u ON p.author_id = u.id
		ORDER BY p.created_at DESC
	`

	rows, err := s.db.Pool.Query(ctx, query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch papers"})
		return
	}
	defer rows.Close()

	var papers []models.PaperWithAuthor
	for rows.Next() {
		var paper models.PaperWithAuthor
		err := rows.Scan(
			&paper.ID, &paper.Title, &paper.Abstract, &paper.Content, &paper.FileUrl, &paper.AuthorID,
			&paper.Status, &paper.CreatedAt, &paper.UpdatedAt,
			&paper.InstitutionCode, &paper.PublicationID, &paper.PublicationISCEDBand, &paper.PublicationTitleAmharic,
			&paper.PublicationDate, &paper.PublicationType, &paper.JournalType, &paper.JournalName, &paper.IndigenousKnowledge,
			&paper.AuthorName, &paper.AuthorEmail,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan paper"})
			return
		}
		papers = append(papers, paper)
	}

	c.JSON(http.StatusOK, papers)
}

func (s *Server) CreatePaper(c *gin.Context) {
	var req models.CreatePaperRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	authorID, err := uuid.Parse(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	paper := models.Paper{
		Title:    req.Title,
		Abstract: req.Abstract,
		Content:  req.Content,
		FileUrl:  req.FileUrl,
		AuthorID: authorID,
		Status:   "submitted",
		Type:     req.Type,
	}

	if paper.Type == "" {
		paper.Type = "research" // Default
	}

	ctx := c.Request.Context()
	query := `
		INSERT INTO papers (title, abstract, content, file_url, author_id, status, type)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, title, abstract, content, file_url, author_id, status, type, created_at, updated_at
	`

	err = s.db.Pool.QueryRow(ctx, query, paper.Title, paper.Abstract, paper.Content, paper.FileUrl, paper.AuthorID, paper.Status, paper.Type).Scan(
		&paper.ID, &paper.Title, &paper.Abstract, &paper.Content, &paper.FileUrl, &paper.AuthorID,
		&paper.Status, &paper.Type, &paper.CreatedAt, &paper.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create paper"})
		return
	}

	// Create notifications for all editors
	go func() {
		// Find all editors
		rows, err := s.db.Pool.Query(context.Background(), "SELECT id FROM users WHERE role = 'editor'")
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var editorID uuid.UUID
				if err := rows.Scan(&editorID); err == nil {
					// Create notification
					s.db.Pool.Exec(context.Background(),
						"INSERT INTO notifications (user_id, message, paper_id) VALUES ($1, $2, $3)",
						editorID, "New paper submitted: "+paper.Title, paper.ID)
				}
			}
		}
	}()

	c.JSON(http.StatusCreated, paper)
}

func (s *Server) UpdatePaper(c *gin.Context) {
	paperID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid paper ID"})
		return
	}

	var req models.UpdatePaperRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	query := `
		UPDATE papers
		SET title = $1, abstract = $2, content = $3, file_url = $4, status = $5, updated_at = NOW()
		WHERE id = $6
		RETURNING id, title, abstract, content, file_url, author_id, status, created_at, updated_at
	`

	var paper models.Paper
	err = s.db.Pool.QueryRow(ctx, query, req.Title, req.Abstract, req.Content, req.FileUrl, req.Status, paperID).Scan(
		&paper.ID, &paper.Title, &paper.Abstract, &paper.Content, &paper.FileUrl, &paper.AuthorID,
		&paper.Status, &paper.CreatedAt, &paper.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update paper"})
		return
	}

	// If admin is publishing or rejecting a recommended paper, notify the editor
	if req.Status == "published" || req.Status == "rejected" {
		go func() {
			// Find the editor who reviewed this paper
			var editorID uuid.UUID
			err := s.db.Pool.QueryRow(context.Background(),
				"SELECT reviewer_id FROM reviews WHERE paper_id = $1 LIMIT 1",
				paper.ID).Scan(&editorID)

			if err == nil {
				statusText := "published"
				if req.Status == "rejected" {
					statusText = "rejected"
				}
				message := fmt.Sprintf("Admin decision: Paper '%s' has been %s", paper.Title, statusText)
				s.db.Pool.Exec(context.Background(),
					"INSERT INTO notifications (user_id, message, paper_id) VALUES ($1, $2, $3)",
					editorID, message, paper.ID)
			}
		}()
	}

	c.JSON(http.StatusOK, paper)
}

func (s *Server) RecommendPaperForPublication(c *gin.Context) {
	paperID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid paper ID"})
		return
	}

	ctx := c.Request.Context()
	// Update paper status to recommended_for_publication
	query := `
		UPDATE papers
		SET status = 'recommended_for_publication', updated_at = NOW()
		WHERE id = $1
		RETURNING id, title, abstract, content, file_url, author_id, status, created_at, updated_at
	`

	var paper models.Paper
	err = s.db.Pool.QueryRow(ctx, query, paperID).Scan(
		&paper.ID, &paper.Title, &paper.Abstract, &paper.Content, &paper.FileUrl, &paper.AuthorID,
		&paper.Status, &paper.CreatedAt, &paper.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to recommend paper"})
		return
	}

	// Notify all admins
	go func() {
		rows, err := s.db.Pool.Query(context.Background(), "SELECT id FROM users WHERE role = 'admin'")
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var adminID uuid.UUID
				if err := rows.Scan(&adminID); err == nil {
					message := fmt.Sprintf("Paper '%s' has been recommended for publication by an editor", paper.Title)
					s.db.Pool.Exec(context.Background(),
						"INSERT INTO notifications (user_id, message, paper_id) VALUES ($1, $2, $3)",
						adminID, message, paper.ID)
				}
			}
		}
	}()

	// Store editor ID for later notification (we'll add a column for this)
	// For now, we'll query reviews to find the editor
	go func() {
		s.db.Pool.Exec(context.Background(),
			"UPDATE papers SET updated_at = NOW() WHERE id = $1",
			paper.ID)
	}()

	c.JSON(http.StatusOK, paper)
}

func (s *Server) UpdatePaperDetails(c *gin.Context) {
	paperID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid paper ID"})
		return
	}

	var req models.UpdatePaperRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()

	// Generate Publication ID if not provided and status is being set to something that implies publication or if it's just missing
	// For now, we'll generate it if it's empty.
	if req.PublicationID == "" {
		req.PublicationID, err = s.generatePublicationID(ctx)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate Publication ID"})
			return
		}
	}

	query := `
		UPDATE papers
		SET institution_code = $1, publication_id = $2, publication_isced_band = $3,
			publication_title_amharic = $4, publication_date = $5, publication_type = $6,
			journal_type = $7, journal_name = $8, indigenous_knowledge = $9,
			updated_at = NOW()
		WHERE id = $10
		RETURNING id, title, abstract, content, file_url, author_id, status, created_at, updated_at,
				  institution_code, publication_id, publication_isced_band, publication_title_amharic,
				  publication_date, publication_type, journal_type, journal_name, indigenous_knowledge
	`

	var paper models.Paper
	err = s.db.Pool.QueryRow(ctx, query,
		req.InstitutionCode, req.PublicationID, req.PublicationISCEDBand,
		req.PublicationTitleAmharic, req.PublicationDate, req.PublicationType,
		req.JournalType, req.JournalName, req.IndigenousKnowledge,
		paperID,
	).Scan(
		&paper.ID, &paper.Title, &paper.Abstract, &paper.Content, &paper.FileUrl, &paper.AuthorID,
		&paper.Status, &paper.CreatedAt, &paper.UpdatedAt,
		&paper.InstitutionCode, &paper.PublicationID, &paper.PublicationISCEDBand,
		&paper.PublicationTitleAmharic, &paper.PublicationDate, &paper.PublicationType,
		&paper.JournalType, &paper.JournalName, &paper.IndigenousKnowledge,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update paper details"})
		return
	}

	// Notify Admin and Coordinator
	go func() {
		// Notify Admins
		rows, err := s.db.Pool.Query(context.Background(), "SELECT id FROM users WHERE role = 'admin'")
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var adminID uuid.UUID
				if err := rows.Scan(&adminID); err == nil {
					message := fmt.Sprintf("Paper details updated for '%s' by Editor", paper.Title)
					s.db.Pool.Exec(context.Background(),
						"INSERT INTO notifications (user_id, message, paper_id) VALUES ($1, $2, $3)",
						adminID, message, paper.ID)
				}
			}
		}

		// Notify Coordinators
		rowsCoord, err := s.db.Pool.Query(context.Background(), "SELECT id FROM users WHERE role = 'coordinator'")
		if err == nil {
			defer rowsCoord.Close()
			for rowsCoord.Next() {
				var coordID uuid.UUID
				if err := rowsCoord.Scan(&coordID); err == nil {
					message := fmt.Sprintf("Paper details updated for '%s' by Editor. Please validate.", paper.Title)
					s.db.Pool.Exec(context.Background(),
						"INSERT INTO notifications (user_id, message, paper_id) VALUES ($1, $2, $3)",
						coordID, message, paper.ID)
				}
			}
		}
	}()

	c.JSON(http.StatusOK, paper)
}

func (s *Server) generatePublicationID(ctx context.Context) (string, error) {
	// Format: SMU_P201817001
	// We need to find the last ID and increment it.
	// Assuming the format is fixed and numeric part is at the end.

	var lastID string
	err := s.db.Pool.QueryRow(ctx, "SELECT publication_id FROM papers WHERE publication_id LIKE 'SMU_P%' ORDER BY publication_id DESC LIMIT 1").Scan(&lastID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return "SMU_P201817001", nil
		}
		// If it's NULL (which it might be for existing papers), we might get here or Scan might fail depending on driver.
		// pgx Scan returns error if NULL is scanned into string without NullString? No, Scan handles it if we use *string or NullString.
		// But here we scan into string. If NULL, it errors.
		// Let's handle it safely.
		return "SMU_P201817001", nil // Default start if error or no rows
	}

	if lastID == "" {
		return "SMU_P201817001", nil
	}

	// Parse the number
	// SMU_P201817001 -> 201817001
	if len(lastID) < 6 {
		return "SMU_P201817001", nil
	}

	prefix := "SMU_P"
	numStr := lastID[len(prefix):]
	var num int
	_, err = fmt.Sscanf(numStr, "%d", &num)
	if err != nil {
		return "SMU_P201817001", nil // Fallback
	}

	newNum := num + 1
	return fmt.Sprintf("%s%d", prefix, newNum), nil
}

func (s *Server) DeletePaper(c *gin.Context) {
	paperID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid paper ID"})
		return
	}

	ctx := c.Request.Context()
	query := `DELETE FROM papers WHERE id = $1`

	_, err = s.db.Pool.Exec(ctx, query, paperID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete paper"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Paper deleted successfully"})
}

// Review Handlers
func (s *Server) GetReviews(c *gin.Context) {
	ctx := c.Request.Context()

	paperID := c.Query("paper_id")
	var query string
	var args []interface{}

	if paperID != "" {
		query = `
			SELECT r.id, r.paper_id, r.reviewer_id, r.rating, r.comments, r.recommendation, r.created_at, r.updated_at,
				   reviewer.name as reviewer_name, reviewer.email as reviewer_email,
				   p.title as paper_title
			FROM reviews r
			LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
			LEFT JOIN papers p ON r.paper_id = p.id
			WHERE r.paper_id = $1
			ORDER BY r.created_at DESC
		`
		args = append(args, paperID)
	} else {
		query = `
			SELECT r.id, r.paper_id, r.reviewer_id, r.rating, r.comments, r.recommendation, r.created_at, r.updated_at,
				   reviewer.name as reviewer_name, reviewer.email as reviewer_email,
				   p.title as paper_title
			FROM reviews r
			LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
			LEFT JOIN papers p ON r.paper_id = p.id
			ORDER BY r.created_at DESC
		`
	}

	rows, err := s.db.Pool.Query(ctx, query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reviews"})
		return
	}
	defer rows.Close()

	var reviews []models.ReviewWithReviewer
	for rows.Next() {
		var review models.ReviewWithReviewer
		err := rows.Scan(
			&review.ID, &review.PaperID, &review.ReviewerID, &review.Rating, &review.Comments,
			&review.Recommendation, &review.CreatedAt, &review.UpdatedAt,
			&review.ReviewerName, &review.ReviewerEmail, &review.PaperTitle,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan review"})
			return
		}
		reviews = append(reviews, review)
	}

	c.JSON(http.StatusOK, reviews)
}

func (s *Server) CreateReview(c *gin.Context) {
	var req models.CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	reviewerID, err := uuid.Parse(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	review := models.Review{
		PaperID:        req.PaperID,
		ReviewerID:     reviewerID,
		Rating:         req.Rating,
		Comments:       req.Comments,
		Recommendation: req.Recommendation,
	}

	ctx := c.Request.Context()
	query := `
		INSERT INTO reviews (paper_id, reviewer_id, rating, comments, recommendation)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, paper_id, reviewer_id, rating, comments, recommendation, created_at, updated_at
	`

	err = s.db.Pool.QueryRow(ctx, query, review.PaperID, review.ReviewerID, review.Rating, review.Comments, review.Recommendation).Scan(
		&review.ID, &review.PaperID, &review.ReviewerID, &review.Rating, &review.Comments,
		&review.Recommendation, &review.CreatedAt, &review.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create review"})
		return
	}

	// Send notification to paper author
	go func() {
		// Get paper details to find author
		var authorID uuid.UUID
		var paperTitle string
		err := s.db.Pool.QueryRow(context.Background(),
			"SELECT author_id, title FROM papers WHERE id = $1",
			review.PaperID).Scan(&authorID, &paperTitle)

		if err == nil {
			// Create notification message with review details
			message := fmt.Sprintf("Your paper '%s' has been reviewed. Rating: %d/5, Recommendation: %s",
				paperTitle, review.Rating, review.Recommendation)

			s.db.Pool.Exec(context.Background(),
				"INSERT INTO notifications (user_id, message, paper_id) VALUES ($1, $2, $3)",
				authorID, message, review.PaperID)
		}
	}()

	c.JSON(http.StatusCreated, review)
}

// Event Handlers
func (s *Server) GetEvents(c *gin.Context) {
	ctx := c.Request.Context()
	status := c.Query("status")

	query := `
		SELECT e.id, e.title, e.description, e.category, e.status, e.date, e.location, e.coordinator_id, e.created_at, e.updated_at,
			   c.name as coordinator_name, c.email as coordinator_email
		FROM events e
		LEFT JOIN users c ON e.coordinator_id = c.id
	`

	var args []interface{}
	if status != "" {
		query += " WHERE e.status = $1"
		args = append(args, status)
	}

	query += " ORDER BY e.date ASC"

	rows, err := s.db.Pool.Query(ctx, query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch events"})
		return
	}
	defer rows.Close()

	var events []models.EventWithCoordinator
	for rows.Next() {
		var event models.EventWithCoordinator
		err := rows.Scan(
			&event.ID, &event.Title, &event.Description, &event.Category, &event.Status, &event.Date, &event.Location, &event.CoordinatorID,
			&event.CreatedAt, &event.UpdatedAt, &event.CoordinatorName, &event.CoordinatorEmail,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan event"})
			return
		}
		events = append(events, event)
	}

	c.JSON(http.StatusOK, events)
}

func (s *Server) PublishEvent(c *gin.Context) {
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID"})
		return
	}

	ctx := c.Request.Context()
	query := `
		UPDATE events
		SET status = 'published', updated_at = NOW()
		WHERE id = $1
		RETURNING id, title, description, category, status, date, location, coordinator_id, created_at, updated_at
	`

	var event models.Event
	err = s.db.Pool.QueryRow(ctx, query, eventID).Scan(
		&event.ID, &event.Title, &event.Description, &event.Category, &event.Status, &event.Date, &event.Location,
		&event.CoordinatorID, &event.CreatedAt, &event.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to publish event"})
		return
	}

	c.JSON(http.StatusOK, event)
}

func (s *Server) CreateEvent(c *gin.Context) {
	var req models.CreateEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	coordinatorID, err := uuid.Parse(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	event := models.Event{
		Title:         req.Title,
		Description:   req.Description,
		Category:      req.Category,
		Status:        "draft",
		Date:          req.Date,
		Location:      req.Location,
		CoordinatorID: coordinatorID,
	}

	ctx := c.Request.Context()
	query := `
		INSERT INTO events (title, description, category, status, date, location, coordinator_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, title, description, category, status, date, location, coordinator_id, created_at, updated_at
	`

	err = s.db.Pool.QueryRow(ctx, query, event.Title, event.Description, event.Category, event.Status, event.Date, event.Location, event.CoordinatorID).Scan(
		&event.ID, &event.Title, &event.Description, &event.Category, &event.Status, &event.Date, &event.Location,
		&event.CoordinatorID, &event.CreatedAt, &event.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create event"})
		return
	}

	c.JSON(http.StatusCreated, event)
}

func (s *Server) UpdateEvent(c *gin.Context) {
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID"})
		return
	}

	var req models.UpdateEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	query := `
		UPDATE events
		SET title = $1, description = $2, category = $3, date = $4, location = $5, updated_at = NOW()
		WHERE id = $6
		RETURNING id, title, description, category, status, date, location, coordinator_id, created_at, updated_at
	`

	var event models.Event
	err = s.db.Pool.QueryRow(ctx, query, req.Title, req.Description, req.Category, req.Date, req.Location, eventID).Scan(
		&event.ID, &event.Title, &event.Description, &event.Category, &event.Status, &event.Date, &event.Location,
		&event.CoordinatorID, &event.CreatedAt, &event.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update event"})
		return
	}

	c.JSON(http.StatusOK, event)
}

func (s *Server) DeleteEvent(c *gin.Context) {
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event ID"})
		return
	}

	ctx := c.Request.Context()
	query := `DELETE FROM events WHERE id = $1`

	_, err = s.db.Pool.Exec(ctx, query, eventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete event"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Event deleted successfully"})
}

// GetAdminUsers returns admin users (for editor to contact admin)
func (s *Server) GetAdminUsers(c *gin.Context) {
	ctx := c.Request.Context()

	query := `
		SELECT id, email, name, role
		FROM users
		WHERE role = 'admin'
		LIMIT 1
	`

	var adminUser struct {
		ID    string `json:"id"`
		Email string `json:"email"`
		Name  string `json:"name"`
		Role  string `json:"role"`
	}

	err := s.db.Pool.QueryRow(ctx, query).Scan(
		&adminUser.ID, &adminUser.Email, &adminUser.Name, &adminUser.Role,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No admin user found"})
		return
	}

	c.JSON(http.StatusOK, adminUser)
}

// CreateNotification creates a notification for a user
func (s *Server) CreateNotification(c *gin.Context) {
	var req struct {
		UserID  string  `json:"user_id" binding:"required"`
		Message string  `json:"message" binding:"required"`
		PaperID *string `json:"paper_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := c.Request.Context()
	query := `
		INSERT INTO notifications (user_id, message, paper_id)
		VALUES ($1, $2, $3)
		RETURNING id, user_id, message, is_read, created_at, paper_id
	`

	var notification models.Notification
	err := s.db.Pool.QueryRow(ctx, query, req.UserID, req.Message, req.PaperID).Scan(
		&notification.ID, &notification.UserID, &notification.Message,
		&notification.IsRead, &notification.CreatedAt, &notification.PaperID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create notification"})
		return
	}

	c.JSON(http.StatusCreated, notification)
}
