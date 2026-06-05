import { useWebSocket } from '../hooks/useWebSocket';
import { Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ConnectionStatus() {
  const { isConnected } = useWebSocket();
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium backdrop-blur-md ${
          isConnected
            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
            : 'bg-red-500/20 border border-red-500/40 text-red-400'
        }`}
      >
        {isConnected ? (
          <>
            <Wifi className="w-3 h-3" />
            <span>Подключено</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3" />
            <span>Нет связи</span>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}