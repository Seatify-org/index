import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Film, User, LogOut, Ticket, Settings, Shield, History, ChevronDown, MapPin, Sun, Moon, Check, Search, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCity } from "../contexts/CityContext";
import AuthModal from "./AuthModal";

const cities = ['Москва', 'Саратов', 'Аткарск'];
const sections = ['movies', 'cinemas', 'showtimes', 'offers'];
const sectionNames: Record<string, string> = {
  movies: 'Фильмы',
  cinemas: 'Кинотеатры',
  showtimes: 'Сеансы',
  offers: 'Акции'
};

export default function Navbar() {
  const location = useLocation();
  // ИСПРАВЛЕНО: убрали isAuthenticated, так как его нет в контексте. 
  // Используем user для проверки авторизации.
  const { user, logout } = useAuth();
  const { selectedCity, setSelectedCity } = useCity();
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState("");
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeSection, setActiveSection] = useState('movies');
  
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const citySearchInputRef = useRef<HTMLInputElement>(null);
  
  const isHomePage = location.pathname === '/';
  
  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('vite-ui-theme') as 'dark' | 'light' || 'dark';
    setTheme(savedTheme);
  }, []);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
        setCitySearchQuery("");
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Focus search input when city dropdown opens
  useEffect(() => {
    if (showCityDropdown && citySearchInputRef.current) {
      setTimeout(() => citySearchInputRef.current?.focus(), 100);
    }
  }, [showCityDropdown]);
  
  // Detect active section on scroll (only on homepage)
  useEffect(() => {
    if (!isHomePage) return;
    
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200; // Offset for navbar
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);
  
  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
  };
  
  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setShowCityDropdown(false);
    setCitySearchQuery("");
  };
  
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('vite-ui-theme', newTheme);
    
    // Dispatch custom event to notify Root component
    window.dispatchEvent(new Event('themeChange'));
  };
  
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // Account for fixed navbar
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveSection(sectionId);
    }
  };
  
  // Filter cities based on search query
  const filteredCities = cities.filter(city => 
    city.toLowerCase().includes(citySearchQuery.toLowerCase())
  );
  
  return (
    <>
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-[1400px]"
      >
        <div className="glass-strong rounded-2xl shadow-2xl">
          {/* Subtle top glow */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-2xl blur-lg -z-10" />
          
          <div className="px-6 h-16 flex items-center justify-between gap-8">
            {/* Logo - Left */}
            <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/40 blur-xl group-hover:bg-purple-500/60 transition-all" />
                <div className="relative w-9 h-9 rounded-xl glass flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Film className="w-4.5 h-4.5 text-purple-400" />
                </div>
              </div>
              <span className="text-xl font-bold text-white">
                Seatify
              </span>
            </Link>
            
            {/* Center - Anchor Navigation (Only on Homepage) */}
            {isHomePage ? (
              <div className="hidden md:flex items-center gap-2 flex-1 justify-center">
                {sections.map((section) => (
                  <button
                    key={section}
                    onClick={() => scrollToSection(section)}
                    className="relative px-4 py-2 rounded-xl text-sm font-medium transition-all group"
                  >
                    <span className={`transition-colors ${
                      activeSection === section
                        ? ''
                        : 'text-gray-400 group-hover:text-current'
                    }`}>
                      {sectionNames[section]}
                    </span>
                    
                    {/* Glowing underline for active section */}
                    {activeSection === section && (
                      <motion.div 
                        layoutId="navUnderline"
                        className="absolute bottom-0 left-2 right-2 h-0.5 liquid-gradient rounded-full"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    
                    {/* Hover glow effect */}
                    <div className={`absolute inset-0 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity ${
                      activeSection === section ? 'opacity-100' : ''
                    }`} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex-1" />
            )}
            
            {/* Right Side - Controls */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* City Selector */}
              <div className="relative" ref={cityDropdownRef}>
                <button
                  onClick={() => setShowCityDropdown(!showCityDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full glass hover:bg-white/10 transition-all group"
                >
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-sm font-medium">{selectedCity}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {/* City Dropdown */}
                <AnimatePresence>
                  {showCityDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden border border-white/20 shadow-xl"
                      style={{
                        background: 'rgba(10, 10, 15, 0.98)',
                        backdropFilter: 'blur(40px)',
                      }}
                    >
                      {/* Search Input */}
                      <div className="p-3 bg-black/30 border-b border-white/10">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            ref={citySearchInputRef}
                            type="text"
                            value={citySearchQuery}
                            onChange={(e) => setCitySearchQuery(e.target.value)}
                            placeholder="Поиск городов..."
                            className="w-full pl-10 pr-10 py-2 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors border border-white/10"
                            style={{
                              background: 'rgba(20, 20, 30, 0.8)',
                            }}
                          />
                          {citySearchQuery && (
                            <button
                              onClick={() => setCitySearchQuery('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* City List */}
                      <div className="max-h-64 overflow-y-auto p-2">
                        {filteredCities.length > 0 ? (
                          filteredCities.map((city) => (
                            <button
                              key={city}
                              onClick={() => handleCitySelect(city)}
                              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition-all text-left"
                            >
                              <span className={selectedCity === city ? 'text-purple-300 font-medium' : 'text-white'}>
                                {city}
                              </span>
                              {selectedCity === city && (
                                <Check className="w-4 h-4 text-purple-400" />
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-400 text-sm">
                            Города не найдены
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="relative w-14 h-7 rounded-full glass hover:bg-white/10 transition-all overflow-hidden group"
              >
                {/* Permanent Track Icons */}
                <div className="absolute inset-0 flex items-center justify-between px-1.5">
                  <Moon className="w-4 h-4 text-gray-400" />
                  <Sun className="w-4 h-4 text-gray-400" />
                </div>

                {/* Moving Knob */}
                <motion.div
                  className="absolute inset-0.5 rounded-full liquid-gradient"
                  animate={{ x: theme === 'dark' ? 0 : 22 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  style={{ width: '22px' }}
                >
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Moon className={`absolute w-4 h-4 transition-all ${theme === 'dark' ? 'opacity-100 text-white' : 'opacity-0'}`} />
                    <Sun className={`absolute w-4 h-4 transition-all ${theme === 'light' ? 'opacity-100 text-white' : 'opacity-0'}`} />
                  </div>
                </motion.div>
              </button>
              
              {/* Profile or Sign In - ИСПРАВЛЕНО: проверка через !user */}
              {!user ? (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 liquid-gradient hover:shadow-lg hover:shadow-purple-500/50 rounded-xl text-sm font-semibold transition-all duration-300"
                >
                  Войти
                </button>
              ) : (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full glass hover:bg-white/10 transition-all"
                  >
                    <div className="w-7 h-7 liquid-gradient rounded-full flex items-center justify-center">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Profile Dropdown */}
                  <AnimatePresence>
                    {showProfileMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden border border-white/20 shadow-xl"
                        style={{
                          background: 'rgba(10, 10, 15, 0.95)',
                          backdropFilter: 'blur(40px)',
                        }}
                      >
                        {/* User Info */}
                        <div className="p-4 border-b border-white/10 bg-black/20">
                          <p className="font-semibold text-sm text-white">{user?.name || 'Пользователь'}</p>
                          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                          {user?.role === 'admin' && (
                            <div className="mt-2 px-2 py-1 liquid-gradient-subtle text-purple-300 text-xs rounded inline-flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Admin
                            </div>
                          )}
                        </div>
                        
                        {/* Menu Items */}
                        <div className="py-2">
                          <Link
                            to="/profile"
                            onClick={() => setShowProfileMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-white/10 hover:shadow-[inset_0_0_12px_rgba(139,92,246,0.3)] transition-all duration-200 relative group"
                          >
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Ticket className="w-4 h-4 text-purple-400" />
                            <span>Мои билеты</span>
                          </Link>
                          
                          <Link
                            to="/purchase-history"
                            onClick={() => setShowProfileMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-white/10 hover:shadow-[inset_0_0_12px_rgba(139,92,246,0.3)] transition-all duration-200 relative group"
                          >
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <History className="w-4 h-4 text-purple-400" />
                            <span>История покупок</span>
                          </Link>
                          
                          <Link
                            to="/profile"
                            onClick={() => setShowProfileMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-white/10 hover:shadow-[inset_0_0_12px_rgba(139,92,246,0.3)] transition-all duration-200 relative group"
                          >
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Settings className="w-4 h-4 text-purple-400" />
                            <span>Настройки</span>
                          </Link>
                          
                          {/* Admin Access */}
                          {user?.role === 'admin' && (
                            <>
                              <div className="my-2 border-t border-white/10" />
                              <Link
                                to="/admin"
                                onClick={() => setShowProfileMenu(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/10 hover:shadow-[inset_0_0_12px_rgba(234,179,8,0.3)] transition-all duration-200 relative group"
                              >
                                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Shield className="w-4 h-4 text-yellow-400" />
                                <span className="text-yellow-400">Панель администратора</span>
                              </Link>
                            </>
                          )}
                        </div>
                        
                        {/* Logout */}
                        <div className="border-t border-white/10">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-white/10 hover:shadow-[inset_0_0_12px_rgba(239,68,68,0.3)] transition-all duration-200 w-full relative group"
                          >
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <LogOut className="w-4 h-4" />
                            <span>Выйти</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.nav>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
}