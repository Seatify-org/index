export type NotificationType =
  | 'booking_created'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'session_changed'
  | 'price_changed'
  | 'system';

export interface WebSocketNotification {
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  timestamp: string;
}

type EventCallback = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private token: string | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  connect(token: string) {
    this.token = token;

    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket уже подключён');
      return;
    }

    // Очищаем предыдущий таймер переподключения
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    try {
      // Подключаемся к WebSocket серверу с JWT токеном
      const wsUrl = `ws://localhost:8082/ws?token=${encodeURIComponent(token)}`;
      this.ws = new WebSocket(wsUrl);

      // Отправляем токен после подключения
      this.ws.onopen = () => {
        console.log('WebSocket подключён');
        this.reconnectAttempts = 0;
        
        // Отправляем токен аутентификации
        if (this.ws && this.token) {
          this.ws.send(JSON.stringify({
            type: 'auth',
            token: this.token
          }));
        }
        
        this.emit('connected', {});
      };

      this.ws.onmessage = (event) => {
        try {
          const notification: WebSocketNotification = JSON.parse(event.data);
          console.log('📨 Получено уведомление:', notification);
          
          // Эмитим событие по типу
          this.emit(notification.type, notification);
          
          // Также эмитим общее событие
          this.emit('notification', notification);
        } catch (error) {
          console.error('Ошибка парсинга WebSocket сообщения:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket отключён:', event.code, event.reason);
        this.emit('disconnected', { code: event.code, reason: event.reason });
        
        // Автоматическое переподключение
        if (this.reconnectAttempts < this.maxReconnectAttempts && this.token) {
          this.reconnectAttempts++;
          console.log(`Переподключение (попытка ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          this.reconnectTimeout = setTimeout(() => {
            this.connect(this.token!);
          }, this.reconnectDelay);
        } else {
          console.error('❌ Превышено максимальное количество попыток переподключения');
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket ошибка:', error);
        this.emit('error', error);
      };
    } catch (error) {
      console.error('Ошибка подключения WebSocket:', error);
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.token = null;
    this.reconnectAttempts = this.maxReconnectAttempts; // Предотвращаем переподключение
  }

  // Подписка на события
  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Возвращаем функцию отписки
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  // Эмит события
  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        // ИСПРАВЛЕНО: добавлены обратные кавычки ``
        console.error(`Ошибка в обработчике события ${event}:`, error);
      }
    });
  }

  // Отправка сообщения на сервер
  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket не подключён, сообщение не отправлено');
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Получить статистику подключений (для отладки)
  getStats() {
    return {
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      listenersCount: this.listeners.size,
    };
  }
}

// Singleton экземпляр
export const wsService = new WebSocketService();