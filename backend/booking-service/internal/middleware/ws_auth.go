package middleware

import (
	"net/http"
)

// WebSocketAuthMiddleware извлекает токен из query параметра
// и добавляет его в заголовок Authorization для стандартной обработки
func WebSocketAuthMiddleware() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := r.URL.Query().Get("token")
			if token != "" {
				// Добавляем токен в заголовок для стандартного JWT middleware
				r.Header.Set("Authorization", "Bearer "+token)
			}
			next.ServeHTTP(w, r)
		})
	}
}
