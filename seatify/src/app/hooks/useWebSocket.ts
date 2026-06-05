import { useEffect, useState } from 'react';
import { wsService, WebSocketNotification } from '../services/websocket';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export function useWebSocket() {
  const { token } = useAuth();
  const [isConnected, setIsConnected] = useState(wsService.isConnected());
  const [notifications, setNotifications] = useState<WebSocketNotification[]>([]);

  useEffect(() => {
    // Слушаем подключение
    const unsubConnected = wsService.on('connected', () => {
      setIsConnected(true);
      console.log('🟢 WebSocket подключён');
    });

    const unsubDisconnected = wsService.on('disconnected', () => {
      setIsConnected(false);
      console.log('🔴 WebSocket отключён');
    });

    // Слушаем уведомления
    const unsubBookingCreated = wsService.on('booking_created', (data: WebSocketNotification) => {
      toast.success(data.message || 'Бронирование создано!');
      setNotifications(prev => [data, ...prev].slice(0, 50));
    });

    const unsubBookingConfirmed = wsService.on('booking_confirmed', (data: WebSocketNotification) => {
      toast.success(data.message || 'Бронирование подтверждено!');
      setNotifications(prev => [data, ...prev].slice(0, 50));
    });

    const unsubBookingCancelled = wsService.on('booking_cancelled', (data: WebSocketNotification) => {
      toast.error(data.message || 'Бронирование отменено');
      setNotifications(prev => [data, ...prev].slice(0, 50));
    });

    const unsubSessionChanged = wsService.on('session_changed', (data: WebSocketNotification) => {
      toast.warning(data.message || 'Время сеанса изменено');
      setNotifications(prev => [data, ...prev].slice(0, 50));
    });

    const unsubPriceChanged = wsService.on('price_changed', (data: WebSocketNotification) => {
      toast.info(data.message || 'Цена изменена');
      setNotifications(prev => [data, ...prev].slice(0, 50));
    });

    const unsubSystem = wsService.on('system', (data: WebSocketNotification) => {
      toast.info(data.message || 'Системное уведомление');
      setNotifications(prev => [data, ...prev].slice(0, 50));
    });

    return () => {
      unsubConnected();
      unsubDisconnected();
      unsubBookingCreated();
      unsubBookingConfirmed();
      unsubBookingCancelled();
      unsubSessionChanged();
      unsubPriceChanged();
      unsubSystem();
    };
  }, []);

  return {
    isConnected,
    notifications,
    stats: wsService.getStats()
  };
}