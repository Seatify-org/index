package ws

import (
	"sync"
	"time"

	"go.uber.org/zap"
)

type Hub struct {
	clients    map[int]*Client
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
	logger     *zap.Logger
}

func NewHub(logger *zap.Logger) *Hub {
	if logger == nil {
		logger = zap.NewNop()
	}
	return &Hub{
		clients:    make(map[int]*Client),
		broadcast:  make(chan []byte, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		logger:     logger,
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.UserID] = client
			h.mu.Unlock()
			h.logger.Info("WebSocket client connected",
				zap.Int("user_id", client.UserID),
				zap.Int("total_clients", len(h.clients)),
			)

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.UserID]; ok {
				delete(h.clients, client.UserID)
				close(client.Send)
				h.logger.Info("WebSocket client disconnected",
					zap.Int("user_id", client.UserID),
					zap.Int("total_clients", len(h.clients)),
				)
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			h.mu.RLock()
			for userID, client := range h.clients {
				select {
				case client.Send <- message:
				default:
					h.logger.Warn("Client send buffer full, disconnecting",
						zap.Int("user_id", userID),
					)
					close(client.Send)
					delete(h.clients, userID)
				}
			}
			h.mu.RUnlock()
		}
	}

}

func (h *Hub) SendToUser(userID int, message []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if client, ok := h.clients[userID]; ok {
		select {
		case client.Send <- message:
			h.logger.Debug("Message sent to user",
				zap.Int("user_id", userID),
				zap.String("message", string(message)),
			)
		default:
			h.logger.Warn("Failed to send message to user (buffer full)",
				zap.Int("user_id", userID),
			)
		}
	} else {
		h.logger.Debug("User not connected, message not sent",
			zap.Int("user_id", userID),
		)
	}

}

func (h *Hub) BroadcastToAll(message []byte) {
	h.broadcast <- message
}

func (h *Hub) GetConnectedUsers() []int {
	h.mu.RLock()
	defer h.mu.RUnlock()

	users := make([]int, 0, len(h.clients))
	for userID := range h.clients {
		users = append(users, userID)
	}
	return users

}

func (h *Hub) IsUserConnected(userID int) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	_, ok := h.clients[userID]
	return ok
}

func (h *Hub) GetClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

const (
	NotificationBookingCreated   = "booking_created"
	NotificationBookingConfirmed = "booking_confirmed"
	NotificationBookingCancelled = "booking_cancelled"
	NotificationSessionChanged   = "session_changed"
	NotificationPriceChanged     = "price_changed"
	NotificationSystem           = "system"
)

type Notification struct {
	Type      string      `json:"type"`
	Title     string      `json:"title"`
	Message   string      `json:"message"`
	Data      interface{} `json:"data,omitempty"`
	Timestamp string      `json:"timestamp"`
}

func NewNotification(notifType, title, message string, data interface{}) *Notification {
	return &Notification{
		Type:      notifType,
		Title:     title,
		Message:   message,
		Data:      data,
		Timestamp: time.Now().Format(time.RFC3339),
	}
}
