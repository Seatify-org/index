import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Popcorn,
  Coffee,
  Gift,
  Sparkles,
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
  // Snacks
  {
    id: 1,
    name: "Попкорн маленький",
    category: "Закуски",
    price: 299,
    image:
      "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400&h=400&fit=crop",
    description: "Маленькое ведро свежего попкорна",
    popular: false,
  },
  {
    id: 2,
    name: "Попкорн средний",
    category: "Закуски",
    price: 399,
    image:
      "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400&h=400&fit=crop",
    description: "Среднее ведро свежего попкорна",
    popular: true,
  },
  {
    id: 3,
    name: "Попкорн большой",
    category: "Закуски",
    price: 499,
    image:
      "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400&h=400&fit=crop",
    description: "Большое ведро свежего попкорна",
    popular: false,
  },
  {
    id: 4,
    name: "Начос с сыром",
    category: "Закуски",
    price: 449,
    image:
      "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&h=400&fit=crop",
    description: "Хрустящие начос с теплым сырным соусом",
  },
  {
    id: 5,
    name: "Ассорти конфет",
    category: "Закуски",
    price: 349,
    image:
      "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&h=400&fit=crop",
    description: "Ассорти кинотеатральных сладостей",
  },

  // Напитки
  {
    id: 6,
    name: "Газировка маленькая",
    category: "Напитки",
    price: 249,
    image:
      "https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&h=400&fit=crop",
    description: "Газированный напиток 473 мл",
  },
  {
    id: 7,
    name: "Газировка большая",
    category: "Напитки",
    price: 299,
    image:
      "https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&h=400&fit=crop",
    description:
      "Газированный напиток 946 мл с бесплатными доливами",
    popular: true,
  },
  {
    id: 8,
    name: "Сок",
    category: "Напитки",
    price: 249,
    image:
      "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop",
    description: "Свежий апельсиновый или яблочный сок",
  },
  {
    id: 9,
    name: "Бутилированная вода",
    category: "Напитки",
    price: 149,
    image:
      "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=400&fit=crop",
    description: "Премиальная родниковая вода",
  },

  // Комбо
  {
    id: 10,
    name: "Классическое комбо",
    category: "Комбо",
    price: 699,
    image:
      "https://images.unsplash.com/photo-1595814432314-90095f342694?w=400&h=400&fit=crop",
    description: "Средний попкорн + Большая газировка",
    popular: true,
  },
  {
    id: 11,
    name: "Семейное комбо",
    category: "Комбо",
    price: 1299,
    image:
      "https://images.unsplash.com/photo-1595814432314-90095f342694?w=400&h=400&fit=crop",
    description: "2 Больших попкорна + 4 напитка + конфеты",
    popular: true,
  },

  // Товары
  {
    id: 12,
    name: "Футболка Seatify",
    category: "Товары",
    price: 1199,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
    description:
      "Премиальная хлопковая кинотеатральная футболка",
  },
  {
    id: 13,
    name: "Кинопостер",
    category: "Товары",
    price: 999,
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=400&fit=crop",
    description: "Коллекционный постер из сегодняшнего фильма",
  },
];

export default function SnacksCheckout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Record<number, number>>({});
  const [bookingData, setBookingData] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<string>("All");

  useEffect(() => {
    const data = sessionStorage.getItem("bookingData");
    if (data) {
      setBookingData(JSON.parse(data));
    } else {
      toast.error('Данные бронирования не найдены. Пожалуйста, сначала выберите места.');
      navigate('/');
    }
  }, [navigate]);

  const categories = [
    "Всё",
    "Комбо",
    "Закуски",
    "Напитки",
    "Товары",
    "Подарочные карты",
  ];

  const filteredItems =
    selectedCategory === "Всё"
      ? snacksAndMerch
      : snacksAndMerch.filter(
          (item) => item.category === selectedCategory,
        );

  const addToCart = (itemId: number) => {
    setCart((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
    toast.success("Добавлено в корзину");
  };

  const removeFromCart = (itemId: number) => {
    setCart((prev) => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) {
        newCart[itemId]--;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const getCartTotal = () => {
    return Object.entries(cart).reduce(
      (sum, [itemId, quantity]) => {
        const item = snacksAndMerch.find(
          (i) => i.id === Number(itemId),
        );
        return sum + (item?.price || 0) * quantity;
      },
      0,
    );
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce(
      (sum, qty) => sum + qty,
      0,
    );
  };

  const handleContinueToPayment = () => {
    // Update booking data with snacks
    const updatedBookingData = {
      ...bookingData,
      snacks: cart,
      snacksTotal: getCartTotal(),
      grandTotal: bookingData.totalPrice + getCartTotal(),
    };
    sessionStorage.setItem(
      "bookingData",
      JSON.stringify(updatedBookingData),
    );
    navigate("/checkout");
  };

  const handleSkip = () => {
    navigate("/checkout");
  };

  if (!bookingData) {
    return null;
  }

  const cartTotal = getCartTotal();
  const totalItems = getTotalItems();

  return (
    <div className="min-h-screen pt-28 pb-12">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Назад
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Закуски и товары
              </h1>
              <p className="text-gray-400">
                Дополните ваш кинопросмотр
              </p>
            </div>

            {/* Cart Summary (Mobile Hidden) */}
            {totalItems > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="hidden md:flex items-center gap-2 glass-strong rounded-xl px-4 py-2"
              >
                <ShoppingBag className="w-5 h-5 text-purple-400" />
                <span className="font-semibold">
                  {totalItems} товаров
                </span>
                <span className="text-gray-400">•</span>
                <span className="font-bold liquid-gradient bg-clip-text text-transparent">
                  {formatRub(cartTotal)}
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="overflow-x-auto -mx-4 px-4 pb-2">
            <div className="flex gap-2 min-w-min">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items Grid */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
            >
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
                      className="group glass-strong rounded-2xl overflow-hidden hover:scale-105 transition-transform"
                    >
                      {/* Item Image */}
                      <div className="relative aspect-square overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                        {/* Popular Badge */}
                        {item.popular && (
                          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 liquid-gradient rounded-lg text-xs font-semibold">
                            <Sparkles className="w-3 h-3" />
                            Популярное
                          </div>
                        )}

                        {/* Category Badge */}
                        <div className="absolute top-2 right-2">
                          <span className="px-2 py-1 glass-strong text-purple-300 rounded-lg text-xs font-medium">
                            {item.category}
                          </span>
                        </div>

                        {/* Quantity Badge */}
                        {quantity > 0 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute bottom-2 right-2 w-8 h-8 liquid-gradient rounded-full flex items-center justify-center font-bold shadow-lg shadow-purple-500/50"
                          >
                            {quantity}
                          </motion.div>
                        )}
                      </div>

                      {/* Item Info */}
                      <div className="p-4">
                        <h3 className="font-semibold mb-1 group-hover:text-purple-300 transition-colors">
                          {item.name}
                        </h3>
                        <p className="text-xs text-gray-400 mb-3 line-clamp-1">
                          {item.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold liquid-gradient bg-clip-text text-transparent">
                            {formatRub(item.price)}
                          </span>

                          {quantity > 0 ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  removeFromCart(item.id)
                                }
                                className="w-8 h-8 glass glass-hover rounded-lg flex items-center justify-center hover:scale-110 transition-all"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  addToCart(item.id)
                                }
                                className="w-8 h-8 liquid-gradient rounded-lg flex items-center justify-center hover:scale-110 transition-all shadow-lg shadow-purple-500/30"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item.id)}
                              className="px-3 py-2 glass glass-hover rounded-lg flex items-center gap-1 text-sm font-medium hover:scale-105 transition-all"
                            >
                              <Plus className="w-4 h-4" />
                              Добавить
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

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-strong rounded-2xl p-6 sticky top-24"
            >
              <h2 className="text-xl font-bold mb-4">
                Сводка заказа
              </h2>

              {/* Booking Details */}
              <div className="space-y-2 mb-4 pb-4 border-b border-white/10">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">
                    Билеты в кино
                  </span>
                  <span className="font-semibold">
                    {formatRub(bookingData.totalPrice)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {bookingData.bookingType ===
                  "general-admission" ? (
                    <>
                      {bookingData.tickets && (
                        <>
                          {bookingData.tickets.adult > 0 &&
                            `${bookingData.tickets.adult} Adult`}
                          {bookingData.tickets.child > 0 &&
                            ` ${bookingData.tickets.child} Child`}
                          {bookingData.tickets.senior > 0 &&
                            ` ${bookingData.tickets.senior} Senior`}
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {bookingData.seats?.length || 0} × seats
                    </>
                  )}
                  {bookingData.movieTitle &&
                    ` • ${bookingData.movieTitle}`}
                </div>
              </div>

              {/* Cart Items */}
              {totalItems > 0 ? (
                <div className="space-y-3 mb-4 pb-4 border-b border-white/10">
                  <h3 className="text-sm font-semibold text-gray-400">
                    Закуски и товары
                  </h3>
                  {Object.entries(cart).map(
                    ([itemId, quantity]) => {
                      const item = snacksAndMerch.find(
                        (i) => i.id === Number(itemId),
                      );
                      if (!item) return null;

                      return (
                        <div
                          key={itemId}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-400">
                            {quantity}× {item.name}
                          </span>
                          <span className="font-semibold">
                            {formatRub(item.price * quantity)}
                          </span>
                        </div>
                      );
                    },
                  )}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">
                    Товары еще не добавлены
                  </p>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between items-center mb-6 text-lg">
                <span className="font-bold">Итого</span>
                <span className="font-bold liquid-gradient bg-clip-text text-transparent text-2xl">
                  {formatRub(bookingData.totalPrice + cartTotal)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleContinueToPayment}
                  className="w-full py-3 liquid-gradient hover:shadow-lg hover:shadow-purple-500/50 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Перейти к оплате
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  onClick={handleSkip}
                  className="w-full py-3 glass glass-hover rounded-xl font-semibold transition-all duration-300"
                >
                  Пропустить
                </button>
              </div>

              {/* Info */}
              <p className="text-xs text-gray-500 text-center mt-4">
                💡 Сэкономьте 15% с нашими комбо-наборами!
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}