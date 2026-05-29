import { motion } from "motion/react";
import { Film, Instagram, Twitter, Facebook, Youtube, Mail, Phone, Apple, Play } from "lucide-react";

export default function Footer() {
  const navigationLinks = [
    { label: "Фильмы", href: "/#movies" },
    { label: "Кинотеатры", href: "/#cinemas" },
    { label: "Сеансы", href: "/#showtimes" },
    { label: "Акции", href: "/#offers" },
  ];
  
  const accountLinks = [
    { label: "Мои билеты", href: "/profile/tickets" },
    { label: "Профиль", href: "/profile" },
    { label: "Настройки", href: "/profile/settings" },
  ];
  
  const supportLinks = [
    { label: "Центр помощи", href: "/help" },
    { label: "Связаться с нами", href: "/contact" },
    { label: "Условия использования", href: "/terms" },
    { label: "Политика конфиденциальности", href: "/privacy" },
  ];
  
  const socialLinks = [
    { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
    { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
    { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
    { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
  ];
  
  return (
    <footer className="relative mt-16 border-t border-white/10 light-theme:border-gray-200">
      {/* Subtle gradient separator */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
      
      {/* Main Footer Content */}
      <div className="glass-strong">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
            {/* Left Side: Footer Links - 8 columns */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Column 1: Brand */}
              <div className="space-y-4">
                <a href="/" className="flex items-center gap-2 group">
                  <div className="relative">
                    <div className="absolute inset-0 bg-purple-500/40 blur-xl group-hover:bg-purple-500/60 transition-all" />
                    <div className="relative w-9 h-9 rounded-xl glass flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Film className="w-5 h-5 text-purple-400" />
                    </div>
                  </div>
                  <span className="text-xl font-bold text-white">
                    Seatify
                  </span>
                </a>
                
                <p className="text-sm text-gray-400 max-w-xs">
                  Ваша умная платформа бронирования билетов в кино
                </p>
                
                {/* Social Icons */}
                <div className="flex items-center gap-2">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 glass glass-hover rounded-lg flex items-center justify-center hover:scale-110 transition-all group"
                      aria-label={social.label}
                    >
                      <social.icon className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
              
              {/* Column 2: Navigation */}
              <div>
                <h3 className="text-sm font-bold mb-4">Навигация</h3>
                <ul className="space-y-2">
                  {navigationLinks.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-gray-400 hover:text-white hover:translate-x-1 inline-block transition-all duration-300"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Column 3: Account */}
              <div>
                <h3 className="text-sm font-bold mb-4">Аккаунт</h3>
                <ul className="space-y-2">
                  {accountLinks.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-gray-400 hover:text-white hover:translate-x-1 inline-block transition-all duration-300"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Right Side: Mobile App Promo - 4 columns */}
            <div className="lg:col-span-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="glass glass-hover rounded-2xl p-6 relative overflow-hidden h-full"
              >
                {/* Glow effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-2xl blur-xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex flex-col items-center gap-4 h-full">
                  {/* Title */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-2">Скачайте приложение Seatify</h3>
                    <p className="text-sm text-gray-400">
                      Бронируйте билеты быстрее, в любое время
                    </p>
                  </div>
                  
                  {/* Phone Mockup - Clean minimal frame */}
                  <div className="relative flex-shrink-0">
                    <div className="relative w-32 h-60 rounded-2xl glass-strong border-2 border-white/20 overflow-hidden shadow-xl">
                      {/* Phone screen content */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/90 to-pink-900/90 p-2">
                        {/* Mini Seatify logo */}
                        <div className="flex items-center gap-1 mb-3">
                          <div className="w-5 h-5 rounded-lg bg-purple-500/50 flex items-center justify-center">
                            <Film className="w-2.5 h-2.5 text-white" />
                          </div>
                          <span className="text-[10px] font-bold text-white">Seatify</span>
                        </div>
                        
                        {/* Mini movie cards */}
                        <div className="space-y-1.5">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="glass rounded-lg p-1.5 flex items-center gap-1.5">
                              <div className="w-8 h-10 rounded bg-gradient-to-br from-purple-500 to-pink-500" />
                              <div className="flex-1 space-y-1">
                                <div className="h-1.5 bg-white/30 rounded w-3/4" />
                                <div className="h-1 bg-white/20 rounded w-1/2" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* App Store Buttons - Realistic style */}
                  <div className="flex flex-col gap-2 w-full">
                    <a
                      href="#"
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-black/80 hover:bg-black rounded-xl transition-all hover:scale-105 border border-white/20"
                    >
                      <Apple className="w-6 h-6" />
                      <div className="text-left">
                        <div className="text-[9px] text-gray-300">Загрузите в</div>
                        <div className="text-sm font-semibold">App Store</div>
                      </div>
                    </a>
                    
                    <a
                      href="#"
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-black/80 hover:bg-black rounded-xl transition-all hover:scale-105 border border-white/20"
                    >
                      <Play className="w-5 h-5" />
                      <div className="text-left">
                        <div className="text-[9px] text-gray-300">Доступно в</div>
                        <div className="text-sm font-semibold">Google Play</div>
                      </div>
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* Support Links & Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-white/10">
            <div>
              <h3 className="text-sm font-bold mb-3">Поддержка</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {supportLinks.map((link, index) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                    {index < supportLinks.length - 1 && <span className="ml-4 text-gray-600">•</span>}
                  </a>
                ))}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <a 
                href="mailto:support@seatify.com" 
                className="flex items-center gap-2 text-xs text-gray-400 hover:text-purple-400 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                support@seatify.com
              </a>
              <a 
                href="tel:+1234567890" 
                className="flex items-center gap-2 text-xs text-gray-400 hover:text-purple-400 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                +1 (234) 567-890
              </a>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-400">
                © 2026 Seatify. Все права защищены
              </p>
              
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <a href="/terms" className="hover:text-white transition-colors">
                  Условия
                </a>
                <span>•</span>
                <a href="/privacy" className="hover:text-white transition-colors">
                  Конфиденциальность
                </a>
                <span>•</span>
                <a href="/cookies" className="hover:text-white transition-colors">
                  Cookies
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}