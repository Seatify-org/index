import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Search, Check } from "lucide-react";

interface CityDropdownProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
}

// Russian cities list - targeting Russian market
const majorCities = ["Москва", "Саратов", "Аткарск"];

const allCities = [
  ...majorCities,
  "Санкт-Петербург",
  "Новосибирск",
  "Екатеринбург",
  "Казань",
  "Нижний Новгород",
  "Челябинск",
  "Самара",
  "Омск",
  "Ростов-на-Дону",
  "Уфа",
  "Красноярск",
  "Пермь",
  "Воронеж",
  "Волгоград",
  "Краснодар",
  "Тюмень",
  "Иркутск",
  "Владивосток",
  "Барнаул",
  "Хабаровск",
  "Ярославль",
  "Томск",
  "Оренбург",
  "Кемерово",
  "Новокузнецк",
  "Рязань",
  "Астрахань",
  "Пенза",
  "Липецк",
  "Тула",
  "Киров",
  "Чебоксары",
  "Калининград",
  "Балашиха",
  "Курск",
  "Сочи",
  "Ульяновск",
  "Ставрополь",
  "Тверь",
  "Ижевск",
  "Брянск",
  "Энгельс",
].sort();

export default function CityDropdown({
  selectedCity,
  onCityChange,
}: CityDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Filter cities based on search query
  const filteredCities =
    searchQuery.trim() === ""
      ? majorCities
      : allCities.filter((city) =>
          city
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
        );

  const handleCitySelect = (city: string) => {
    onCityChange(city);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Selected City Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 glass rounded-xl text-sm text-white bg-transparent focus:outline-none focus:border-purple-500/50 transition-colors flex items-center justify-between gap-2 hover:bg-white/5"
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-purple-400" />
          <span>{selectedCity}</span>
        </div>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </motion.svg>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 left-0 w-full md:w-80 rounded-xl shadow-2xl z-50 overflow-hidden border border-white/20"
            style={{
              background: "rgba(10, 10, 15, 0.98)",
              backdropFilter: "blur(40px)",
            }}
          >
            {/* Search Input */}
            <div className="p-3 border-b border-white/10 bg-black/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(e.target.value)
                  }
                  placeholder="Поиск города..."
                  className="w-full pl-10 pr-3 py-2 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors border border-white/10"
                  style={{
                    background: "rgba(20, 20, 30, 0.8)",
                  }}
                />
              </div>
            </div>

            {/* Cities List */}
            <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {filteredCities.length > 0 ? (
                <div className="p-1">
                  {searchQuery.trim() === "" && (
                    <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider">
                      Основные города
                    </div>
                  )}

                  {filteredCities.map((city) => (
                    <button
                      key={city}
                      onClick={() => handleCitySelect(city)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all ${
                        selectedCity === city
                          ? "bg-purple-500/20 text-white"
                          : "text-gray-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span>{city}</span>
                      {selectedCity === city && (
                        <Check className="w-4 h-4 text-purple-400" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-gray-400">
                    Города не найдены
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Попробуйте другой запрос
                  </p>
                </div>
              )}
            </div>

            {/* Footer Info */}
            {searchQuery.trim() !== "" &&
              filteredCities.length > 0 && (
                <div className="p-2 border-t border-white/10">
                  <p className="text-xs text-gray-500 text-center">
                    {filteredCities.length}{" "}
                    {filteredCities.length === 1
                      ? "город"
                      : filteredCities.length < 5
                        ? "города"
                        : "городов"}{" "}
                    найдено
                  </p>
                </div>
              )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}