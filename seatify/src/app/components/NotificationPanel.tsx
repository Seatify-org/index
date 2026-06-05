import { useState } from 'react';
import { Bell, X, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useWebSocket } from '../hooks/useWebSocket';
import { WebSocketNotification } from '../services/websocket';

export default function NotificationPanel() {
const [isOpen, setIsOpen] = useState(false);
const { notifications } = useWebSocket();
const [unreadCount, setUnreadCount] = useState(0);
const getIcon = (type: string) => {
switch (type) {
case 'booking_created': return '🎫';
case 'booking_confirmed': return '✅';
case 'booking_cancelled': return '❌';
case 'session_changed': return '⏰';
case 'price_changed': return '💰';
case 'system': return 'ℹ️';
default: return '📢';
}
};
const getColor = (type: string) => {
switch (type) {
case 'booking_created': return 'text-blue-400';
case 'booking_confirmed': return 'text-emerald-400';
case 'booking_cancelled': return 'text-red-400';
case 'session_changed': return 'text-orange-400';
case 'price_changed': return 'text-yellow-400';
case 'system': return 'text-purple-400';
default: return 'text-gray-400';
}
};
const formatTime = (timestamp: string) => {
const date = new Date(timestamp);
return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};
const clearAll = () => {
// В реальной реализации здесь была бы очистка через store
setUnreadCount(0);
};
return (
<div className="relative">
<button
onClick={() => setIsOpen(!isOpen)}
className="relative p-2 glass rounded-lg hover:bg-white/10 transition-all active:scale-95"
>
<Bell className="w-5 h-5" />
{notifications.length > 0 && (
<span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white animate-pulse">
{notifications.length > 9 ? '9+' : notifications.length}
</span>
)}
</button>
  <AnimatePresence>
    {isOpen && (
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40"
        />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute right-0 top-full mt-2 w-80 md:w-96 glass-strong rounded-xl overflow-hidden border border-white/20 shadow-2xl z-50"
        >
          {/* Header */}
          <div className="p-3 md:p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-semibold text-sm md:text-base">Уведомления</h3>
            {notifications.length > 0 && (
              <button 
                onClick={clearAll} 
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1 active:scale-95 transition-transform"
              >
                <Trash2 className="w-3 h-3" />
                <span className="hidden sm:inline">Очистить</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 md:p-12 text-center text-gray-400 text-sm">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Нет уведомлений</p>
              </div>
            ) : (
              notifications.map((notif, index) => (
                <motion.div
                  key={`${notif.timestamp}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 md:p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-2 md:gap-3">
                    <span className="text-xl md:text-2xl flex-shrink-0">{getIcon(notif.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs md:text-sm font-semibold mb-0.5 ${getColor(notif.type)}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs md:text-sm text-gray-300 mb-1">{notif.message}</p>
                      <p className="text-[10px] md:text-xs text-gray-500">
                        {formatTime(notif.timestamp)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
</div>
);
}