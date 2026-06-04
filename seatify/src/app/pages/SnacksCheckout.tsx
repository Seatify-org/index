import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Plus, Minus, ShoppingBag, ArrowRight, Sparkles, X,
} from "lucide-react";
import { toast } from "sonner";
import { formatRub } from "../utils/formatRub";

interface SnackItem {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  popular?: boolean;
}

const snacksAndMerch: SnackItem[] = [
  { id: 1, name: "Попкорн маленький", category: "Закуски", price: 299, image: "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400&h=400&fit=crop", description: "Маленькое ведро свежего попкорна", popular: false },
  { id: 2, name: "Попкорн средний", category: "Закуски", price: 399, image: "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400&h=400&fit=crop", description: "Среднее ведро свежего попкорна", popular: true },
  { id: 3, name: "Попкорн большой", category: "Закуски", price: 499, image: "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400&h=400&fit=crop", description: "Большое ведро свежего попкорна", popular: false },
  { id: 4, name: "Начос с сыром", category: "Закуски", price: 449, image: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&h=400&fit=crop", description: "Хрустящие начос с теплым сырным соусом" },
  { id: 5, name: "Ассорти конфет", category: "Закуски", price: 349, image: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&h=400&fit=crop", description: "Ассорти кинотеатральных сладостей" },
  { id: 6, name: "Газировка маленькая", category: "Напитки", price: 249, image: "https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&h=400&fit=crop", description: "Газированный напиток 473 мл" },
  { id: 7, name: "Газировка большая", category: "Напитки", price: 299, image: "https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&h=400&fit=crop", description: "Газированный напиток 946 мл с бесплатными доливами", popular: true },
  { id: 8, name: "Сок", category: "Напитки", price: 249, image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop", description: "Свежий апельсиновый или яблочный сок" },
  { id: 9, name: "Бутилированная вода", category: "Напитки", price: 149, image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=400&fit=crop", description: "Премиальная родниковая вода" },
  { id: 10, name: "Классическое комбо", category: "Комбо", price: 699, image: "https://images.unsplash.com/photo-1595814432314-90095f342694?w=400&h=400&fit=crop", description: "Средний попкорн + Большая газировка", popular: true },
  { id: 11, name: "Семейное комбо", category: "Комбо", price: 1299, image: "https://images.unsplash.com/photo-1595814432314-90095f342694?w=400&h=400&fit=crop", description: "2 Больших попкорна + 4 напитка + конфеты", popular: true },
  { id: 12, name: "Футболка Seatify", category: "Товары", price: 1199, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop", description: "Премиальная хлопковая кинотеатральная футболка" },
  { id: 13, name: "Кинопостер", category: "Товары", price: 999, image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=400&fit=crop", description: "Коллекционный постер из сегодняшнего фильма" },
];

export default function SnacksCheckout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Record<number, number>>({});
  const [bookingData, setBookingData] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Всё");
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    const data = sessionStorage.getItem("bookingData");
    if (data) {
      const parsed = JSON.parse(data);
      if (typeof parsed.sessionId === 'string') {
         parsed.sessionId = parseInt(parsed.sessionId.replace(/\D/g, ''), 10) || 1;
      }
      setBookingData(parsed);
    } else {
      toast.error('Данные бронирования не найдены.');
      navigate('/');
    }
  }, [navigate]);

  const categories = ["Всё", "Комбо", "Закуски", "Напитки", "Товары", "Подарочные карты"];
  const filteredItems = selectedCategory === "Всё" ? snacksAndMerch : snacksAndMerch.filter((item) => item.category === selectedCategory);

  const addToCart = (itemId: number) => {
    setCart((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
    toast.success("Добавлено в корзину");
  };

  const removeFromCart = (itemId: number) => {
    setCart((prev) => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) newCart[itemId]--;
      else delete newCart[itemId];
      return newCart;
    });
  };

  const getCartTotal = () => {
    return Object.entries(cart).reduce((sum, [itemId, quantity]) => {
      const item = snacksAndMerch.find((i) => i.id === Number(itemId));
      return sum + (item?.price || 0) * quantity;
    }, 0);
  };

  const getTotalItems = () => Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const handleContinueToPayment = () => {
    const updatedBookingData = {
      ...bookingData,
      snacks: cart,
      snacksTotal: getCartTotal(),
      grandTotal: bookingData.totalPrice + getCartTotal(),
      sessionId: typeof bookingData.sessionId === 'number' ? bookingData.sessionId : parseInt(String(bookingData.sessionId), 10) || 1,
    };
    sessionStorage.setItem("bookingData", JSON.stringify(updatedBookingData));
    navigate("/checkout");
  };

  const handleSkip = () => {
     const updatedBookingData = {
      ...bookingData,
      sessionId: typeof bookingData.sessionId === 'number' ? bookingData.sessionId : parseInt(String(bookingData.sessionId), 10) || 1,
    };
    sessionStorage.setItem("bookingData", JSON.stringify(updatedBookingData));
    navigate("/checkout");
  };

  if (!bookingData) return null;

  const cartTotal = getCartTotal();
  const totalItems = getTotalItems();

  return (
    <div className="min-h-screen pt-20 md:pt-28 pb-24 md:pb-12">
      <div className="max-w-[1600px] mx-auto px-3 md:px-4 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-4 md:mb-6 lg:mb-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 md:gap-2 text-gray-400 hover:text-white transition-colors mb-2 md:mb-4 active:scale-95">
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" /> <span className="text-sm">Назад</span>
          </button>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-1 md:mb-2">Закуски и товары</h1>
              <p className="text-xs md:text-sm text-gray-400">Дополните ваш кинопросмотр</p>
            </div>
            {totalItems > 0 && (
              <>
                {/* Desktop cart summary */}
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="hidden lg:flex items-center gap-2 glass-strong rounded-xl px-4 py-2">
                  <ShoppingBag className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold text-sm">{totalItems} товаров</span>
                  <span className="text-gray-400">•</span>
                  <span className="font-bold liquid-gradient bg-clip-text text-transparent">{formatRub(cartTotal)}</span>
                </motion.div>
                
                {/* Mobile cart button */}
                <button
                  onClick={() => setShowCart(true)}
                  className="lg:hidden relative p-2.5 glass-strong rounded-xl active:scale-95 transition-transform"
                >
                  <ShoppingBag className="w-5 h-5 text-purple-400" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 liquid-gradient rounded-full flex items-center justify-center text-[10px] font-bold">
                    {totalItems}
                  </span>
                </button>
              </>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-4 md:mb-6">
          <div className="overflow-x-auto -mx-3 md:-mx-4 px-3 md:px-4 pb-2 scrollbar-hide">
            <div className="flex gap-1.5 md:gap-2 min-w-min">
              {categories.map((category) => (
                <button 
                  key={category} 
                  onClick={() => setSelectedCategory(category)} 
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap active:scale-95 ${
                    selectedCategory === category 
                      ? "liquid-gradient text-white shadow-lg shadow-purple-500/30" 
                      : "glass glass-hover text-gray-400"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-4">
              <AnimatePresence>
                {filteredItems.map((item, index) => {
                  const quantity = cart[item.id] || 0;
                  return (
                    <motion.div 
                      key={item.id} 
                      initial={{ opacity: 0, scale: 0.9 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      exit={{ opacity: 0, scale: 0.9 }} 
                      transition={{ delay: index * 0.05 }} 
                      className="group glass-strong rounded-xl md:rounded-2xl overflow-hidden hover:scale-[1.02] md:hover:scale-105 transition-transform active:scale-[0.98]"
                    >
                      <div className="relative aspect-square overflow-hidden">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        {item.popular && (
                          <div className="absolute top-1.5 md:top-2 left-1.5 md:left-2 flex items-center gap-0.5 md:gap-1 px-1.5 md:px-2 py-0.5 md:py-1 liquid-gradient rounded-md md:rounded-lg text-[9px] md:text-xs font-semibold">
                            <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3" /> <span className="hidden sm:inline">Популярное</span><span className="sm:hidden">Хит</span>
                          </div>
                        )}
                        <div className="absolute top-1.5 md:top-2 right-1.5 md:right-2">
                          <span className="px-1.5 md:px-2 py-0.5 md:py-1 glass-strong text-purple-300 rounded-md md:rounded-lg text-[9px] md:text-xs font-medium">{item.category}</span>
                        </div>
                        {quantity > 0 && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute bottom-1.5 md:bottom-2 right-1.5 md:right-2 w-6 h-6 md:w-8 md:h-8 liquid-gradient rounded-full flex items-center justify-center font-bold text-xs md:text-sm shadow-lg shadow-purple-500/50">
                            {quantity}
                          </motion.div>
                        )}
                      </div>
                      <div className="p-2.5 md:p-4">
                        <h3 className="font-semibold text-xs md:text-sm mb-0.5 md:mb-1 group-hover:text-purple-300 transition-colors line-clamp-1">{item.name}</h3>
                        <p className="text-[10px] md:text-xs text-gray-400 mb-2 md:mb-3 line-clamp-1">{item.description}</p>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-sm md:text-lg font-bold liquid-gradient bg-clip-text text-transparent">{formatRub(item.price)}</span>
                          {quantity > 0 ? (
                            <div className="flex items-center gap-1 md:gap-2">
                              <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 md:w-8 md:h-8 glass glass-hover rounded-md md:rounded-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"><Minus className="w-3 h-3 md:w-4 md:h-4" /></button>
                              <button onClick={() => addToCart(item.id)} className="w-7 h-7 md:w-8 md:h-8 liquid-gradient rounded-md md:rounded-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-purple-500/30"><Plus className="w-3 h-3 md:w-4 md:h-4" /></button>
                            </div>
                          ) : (
                            <button onClick={() => addToCart(item.id)} className="px-2 md:px-3 py-1.5 md:py-2 glass glass-hover rounded-md md:rounded-lg flex items-center gap-0.5 md:gap-1 text-[10px] md:text-sm font-medium hover:scale-105 active:scale-95 transition-all">
                              <Plus className="w-3 h-3 md:w-4 md:h-4" /> <span className="hidden sm:inline">Добавить</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Desktop sidebar cart */}
          <div className="hidden lg:block lg:col-span-1">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass-strong rounded-2xl p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4">Сводка заказа</h2>
              <div className="space-y-2 mb-4 pb-4 border-b border-white/10">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Билеты в кино</span>
                  <span className="font-semibold">{formatRub(bookingData.totalPrice)}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {bookingData.seats?.length || 0} × места {bookingData.movieTitle && `• ${bookingData.movieTitle}`}
                </div>
              </div>
              {totalItems > 0 ? (
                <div className="space-y-3 mb-4 pb-4 border-b border-white/10">
                  <h3 className="text-sm font-semibold text-gray-400">Закуски и товары</h3>
                  {Object.entries(cart).map(([itemId, quantity]) => {
                    const item = snacksAndMerch.find((i) => i.id === Number(itemId));
                    if (!item) return null;
                    return (
                      <div key={itemId} className="flex justify-between text-sm">
                        <span className="text-gray-400">{quantity}× {item.name}</span>
                        <span className="font-semibold">{formatRub(item.price * quantity)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Товары еще не добавлены</p>
                </div>
              )}
              <div className="flex justify-between items-center mb-6 text-lg">
                <span className="font-bold">Итого</span>
                <span className="font-bold liquid-gradient bg-clip-text text-transparent text-2xl">{formatRub(bookingData.totalPrice + cartTotal)}</span>
              </div>
              <div className="space-y-3">
                <button onClick={handleContinueToPayment} className="w-full py-3 liquid-gradient hover:shadow-lg hover:shadow-purple-500/50 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 active:scale-98">
                  Перейти к оплате <ArrowRight className="w-5 h-5" />
                </button>
                <button onClick={handleSkip} className="w-full py-3 glass glass-hover rounded-xl font-semibold transition-all duration-300 active:scale-98">Пропустить</button>
              </div>
              <p className="text-xs text-gray-500 text-center mt-4">💡 Сэкономьте 15% с нашими комбо-наборами!</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Cart Bar */}
      {totalItems > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-3 md:p-4"
        >
          <div className="glass-strong rounded-xl md:rounded-2xl p-3 md:p-4 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <ShoppingBag className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="text-xs md:text-sm text-gray-400">{totalItems} товаров</span>
                </div>
                <div className="text-lg md:text-xl font-bold liquid-gradient bg-clip-text text-transparent truncate">
                  {formatRub(bookingData.totalPrice + cartTotal)}
                </div>
              </div>
              <button
                onClick={handleContinueToPayment}
                className="px-4 md:px-6 py-2.5 md:py-3 liquid-gradient rounded-lg md:rounded-xl font-semibold text-sm flex items-center gap-1.5 md:gap-2 active:scale-95 transition-transform flex-shrink-0"
              >
                <span className="hidden sm:inline">К оплате</span>
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
            <button
              onClick={handleSkip}
              className="w-full mt-2 py-2 glass glass-hover rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all active:scale-98"
            >
              Пропустить закуски
            </button>
          </div>
        </motion.div>
      )}

      {/* Mobile Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)}
              className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-hidden"
            >
              <div className="glass-strong rounded-t-3xl border-t border-white/10 max-h-[80vh] overflow-y-auto">
                <div className="sticky top-0 glass-strong p-4 border-b border-white/10 flex items-center justify-between">
                  <h2 className="text-lg font-bold">Корзина</h2>
                  <button
                    onClick={() => setShowCart(false)}
                    className="p-2 glass rounded-lg active:scale-95 transition-transform"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="space-y-2 pb-4 border-b border-white/10">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Билеты в кино</span>
                      <span className="font-semibold">{formatRub(bookingData.totalPrice)}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {bookingData.seats?.length || 0} × места {bookingData.movieTitle && `• ${bookingData.movieTitle}`}
                    </div>
                  </div>
                  
                  {totalItems > 0 ? (
                    <div className="space-y-3 pb-4 border-b border-white/10">
                      <h3 className="text-sm font-semibold text-gray-400">Закуски и товары</h3>
                      {Object.entries(cart).map(([itemId, quantity]) => {
                        const item = snacksAndMerch.find((i) => i.id === Number(itemId));
                        if (!item) return null;
                        return (
                          <div key={itemId} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{item.name}</p>
                                <p className="text-xs text-gray-400">{formatRub(item.price)} × {quantity}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 glass rounded-md flex items-center justify-center active:scale-95 transition-transform">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-sm font-semibold w-6 text-center">{quantity}</span>
                              <button onClick={() => addToCart(item.id)} className="w-7 h-7 liquid-gradient rounded-md flex items-center justify-center active:scale-95 transition-transform">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">Товары еще не добавлены</p>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-lg pt-2">
                    <span className="font-bold">Итого</span>
                    <span className="font-bold liquid-gradient bg-clip-text text-transparent text-2xl">{formatRub(bookingData.totalPrice + cartTotal)}</span>
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    <button onClick={handleContinueToPayment} className="w-full py-3 liquid-gradient hover:shadow-lg hover:shadow-purple-500/50 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 active:scale-98">
                      Перейти к оплате <ArrowRight className="w-5 h-5" />
                    </button>
                    <button onClick={handleSkip} className="w-full py-3 glass glass-hover rounded-xl font-semibold transition-all duration-300 active:scale-98">Пропустить</button>
                  </div>
                  
                  <p className="text-xs text-gray-500 text-center">💡 Сэкономьте 15% с нашими комбо-наборами!</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}