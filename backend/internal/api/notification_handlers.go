
// Notification Handlers
func (s *Server) GetNotifications(c *gin.Context) {
	userID, _ := c.Get("user_id")
	uid, err := uuid.Parse(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	ctx := c.Request.Context()
	query := `
		SELECT id, user_id, message, paper_id, is_read, created_at
		FROM notifications
		WHERE user_id = $1
		ORDER BY created_at DESC
	`

	rows, err := s.db.Pool.Query(ctx, query, uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notifications"})
		return
	}
	defer rows.Close()

	var notifications []models.Notification
	for rows.Next() {
		var notification models.Notification
		err := rows.Scan(
			&notification.ID, &notification.UserID, &notification.Message,
			&notification.PaperID, &notification.IsRead, &notification.CreatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan notification"})
			return
		}
		notifications = append(notifications, notification)
	}

	c.JSON(http.StatusOK, notifications)
}

func (s *Server) MarkNotificationRead(c *gin.Context) {
	notificationID := c.Param("id")
	id, err := uuid.Parse(notificationID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID"})
		return
	}

	ctx := c.Request.Context()
	query := `
		UPDATE notifications
		SET is_read = true
		WHERE id = $1
		RETURNING id, user_id, message, paper_id, is_read, created_at
	`

	var notification models.Notification
	err = s.db.Pool.QueryRow(ctx, query, id).Scan(
		&notification.ID, &notification.UserID, &notification.Message,
		&notification.PaperID, &notification.IsRead, &notification.CreatedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark notification as read"})
		return
	}

	c.JSON(http.StatusOK, notification)
}
