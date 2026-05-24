import { useState } from "react";
import { motion } from "motion/react";
import { ShoppingBag, Calendar, Filter, Film, Popcorn, Shirt, ArrowLeft } from "lucide-react";
import { formatRub } from "../utils/formatRub";
import { useAuth } from "../contexts/AuthContext";
import { movies } from "../data/movies";
import { useNavigate } from "react-router";

type FilterType = 'all' | 'tickets' | 'food' | 'merch';
type PurchaseType = 'ticket' | 'food' | 'merch';

interface Purchase {
  id: string;
  type: PurchaseType;
  title: string;
  imageUrl: string;
  date: string;
  price: number;
  details?: string;
}

const mockPurchases: Purchase[] = [
  {
    id: 'p1',
    type: 'ticket',
    title: 'Neon Dreams',
    imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop',
    date: '2026-03-28',
    price: 1499,
    details: '2 билета • KARO 11 Oktyabr',
  },
  {
    id: 'p2',
    type: 'food',
    title: 'Попкорн большой + 2 газировки',
    imageUrl: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=400&h=400&fit=crop',
    date: '2026-03-28',
    price: 1097,
    details: 'Семейное комбо',
  },
  {
    id: 'p3',
    type: 'ticket',
    title: 'The Last Horizon',
    imageUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=600&fit=crop',
    date: '2026-03-20',
    price: 499,
    details: '1 билет • Formula Kino Europe',
  },
  {
    id: 'p4',
    type: 'merch',
    title: 'Футболка Quantum Nexus',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    date: '2026-03-15',
    price: 1199,
    details: 'Размер: L • Чёрный',
  },
  {
    id: 'p5',
    type: 'ticket',
    title: 'Celestial',
    imageUrl: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&h=600&fit=crop',
    date: '2026-03-12',
    price: 1499,
    details: '2 билета • Pioneer Cinema',
  },
  {
    id: 'p6',
    type: 'food',
    title: 'Начос + хот-дог',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop',
    date: '2026-03-12',
    price: 748,
    details: 'Премиум закуски',
  },
  {
    id: 'p7',
    type: 'ticket',
    title: 'Velocity',
    imageUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=600&fit=crop',
    date: '2026-03-08',
    price: 1999,
    details: '2 билета • 4DX • Formula Kino Europe',
  },
  {
    id: 'p8',
    type: 'ticket',
    title: 'Midnight Echoes',
    imageUrl: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=600&fit=crop',
    date: '2026-03-05',
    price: 1399,
    details: '2 билета • KARO 13 Kuntsevo',
  },
  {
    id: 'p9',
    type: 'food',
    title: 'Ведро попкорна',
    imageUrl: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400&h=400&fit=crop',
    date: '2026-03-01',
    price: 499,
    details: 'Большой попкорн',
  },
  {
    id: 'p10',
    type: 'merch',
    title: 'Постер Neon Dreams',
    imageUrl: 'https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=400&h=400&fit=crop',
    date: '2026-02-28',
    price: 999,
    details: '60×90 см • Премиум печать',
  },
];

export default function PurchaseHistory() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const navigate = useNavigate();
  
  const filteredPurchases = mockPurchases.filter(purchase => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'tickets') return purchase.type === 'ticket';
    if (activeFilter === 'food') return purchase.type === 'food';
    if (activeFilter === 'merch') return purchase.type === 'merch';
    return true;
  });
  
  const totalSpent = filteredPurchases.reduce((sum, p) => sum + p.price, 0);
  
  const getTypeIcon = (type: PurchaseType) => {
    switch (type) {
      case 'ticket': return <Film className="w-4 h-4" />;
      case 'food': return <Popcorn className="w-4 h-4" />;
      case 'merch': return <Shirt className="w-4 h-4" />;
    }
  };
  
  const getTypeLabel = (type: PurchaseType) => {
    switch (type) {
      case 'ticket': return 'Билет';
      case 'food': return 'Еда и напитки';
      case 'merch': return 'Товары';
    }
  };
  
  const getTypeColor = (type: PurchaseType) => {
    switch (type) {
      case 'ticket': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'food': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'merch': return 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30';
    }
  };
  
  return (
    <div className="min-h-screen pt-16 pb-12">
      {/* Top Spacing Buffer */}
      <div className="h-16 bg-gradient-to-b from-transparent to-transparent" />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Назад</span>
        </button>
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">История покупок</h1>
              <p className="text-sm text-gray-400">Отслеживайте все ваши транзакции</p>
            </div>
          </div>
        </motion.div>
        
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between mb-8 flex-wrap gap-4"
        >
          <div className="flex gap-2">
            {(['all', 'tickets', 'food', 'merch'] as FilterType[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeFilter === filter
                    ? 'liquid-gradient text-white shadow-lg shadow-purple-500/30'
                    : 'glass text-gray-400 hover:text-white hover:glass-hover'
                }`}
              >
                <span className="capitalize">{filter === 'tickets' ? 'Билеты' : filter === 'food' ? 'Еда' : filter === 'merch' ? 'Товары' : 'Всего'}</span>
              </button>
            ))}
          </div>
          
          <div className="glass-strong px-4 py-2 rounded-xl">
            <span className="text-sm text-gray-400">Всего: </span>
            <span className="text-lg font-bold text-white">
              {formatRub(totalSpent)}
            </span>
          </div>
        </motion.div>
        
        {/* Purchase List */}
        <div className="space-y-3">
          {filteredPurchases.map((purchase, index) => (
            <motion.div
              key={purchase.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group glass-strong rounded-2xl p-4 transition-all hover:scale-[1.01] cursor-pointer"
            >
              {/* Glow Effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/20 to-pink-500/0 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
              
              <div className="flex gap-4 items-center">
                {/* Image */}
                <div className="relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden glass">
                  <img 
                    src={purchase.imageUrl} 
                    alt={purchase.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <h3 className="font-semibold truncate group-hover:text-purple-300 transition-colors">
                      {purchase.title}
                    </h3>
                    <span className="text-lg font-bold whitespace-nowrap">
                      {formatRub(purchase.price)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Type Badge */}
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${getTypeColor(purchase.type)}`}>
                      {getTypeIcon(purchase.type)}
                      <span>{getTypeLabel(purchase.type)}</span>
                    </div>
                    
                    {/* Date */}
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(purchase.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    
                    {/* Details */}
                    {purchase.details && (
                      <>
                        <span className="text-gray-600">•</span>
                        <span className="text-xs text-gray-400">{purchase.details}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Empty State */}
        {filteredPurchases.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center min-h-[400px]"
          >
            <div className="text-center glass-strong rounded-3xl p-12 max-w-md">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-purple-500/20 blur-3xl" />
                <div className="relative w-20 h-20 mx-auto glass rounded-2xl flex items-center justify-center">
                  <Filter className="w-10 h-10 text-gray-600" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold mb-3">Покупки не найдены</h3>
              <p className="text-gray-400">
                Нет покупок, соответствующих фильтру
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}