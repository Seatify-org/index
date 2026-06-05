package ws

import (
	"net/http"

	"github.com/gorilla/websocket"
	"github.com/seatify/backend/booking-service/internal/middleware"
	"go.uber.org/zap"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins in development
		// In production, restrict to your frontend domain
		return true
	},
}

// HandleWebSocket handles WebSocket upgrade requests
func HandleWebSocket(hub *Hub, logger *zap.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get user ID from context (set by JWT middleware)
		userID, ok := r.Context().Value(middleware.UserIDKey).(int)
		if !ok || userID <= 0 {
			logger.Error("Failed to get user ID from context")
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Upgrade HTTP connection to WebSocket
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			logger.Error("WebSocket upgrade failed",
				zap.Error(err),
				zap.Int("user_id", userID),
			)
			return
		}

		// Create new client
		client := NewClient(hub, conn, userID, logger)

		// Register client with hub
		hub.register <- client

		// Send welcome message
		welcome := NewNotification(
			NotificationSystem,
			"Подключение установлено",
			"Вы успешно подключены к системе уведомлений",
			nil,
		)
		if err := conn.WriteJSON(welcome); err != nil {
			logger.Error("Failed to send welcome message",
				zap.Error(err),
				zap.Int("user_id", userID),
			)
		}

		// Start client pumps in goroutines
		go client.WritePump()
		go client.ReadPump()

		logger.Info("WebSocket connection established",
			zap.Int("user_id", userID),
			zap.String("remote_addr", r.RemoteAddr),
		)
	}
}
