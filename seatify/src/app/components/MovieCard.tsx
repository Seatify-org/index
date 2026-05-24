import { Link, useNavigate } from "react-router";
import { Star, Clock, Play, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import type { Movie } from "../data/movies";
import TrailerModal from "./TrailerModal";

interface MovieCardProps {
  movie: Movie;
  selectedCinema?: string | null;
  selectedDate?: string;
}

export default function MovieCard({ movie, selectedCinema, selectedDate }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const navigate = useNavigate();
  
  // Build URL with parameters
  const buildMovieUrl = () => {
    const params = new URLSearchParams();
    if (selectedCinema) params.set('cinema', selectedCinema);
    if (selectedDate) params.set('date', selectedDate);
    const queryString = params.toString();
    return `/movie/${movie.id}${queryString ? `?${queryString}` : ''}`;
  };
  
  const handleMoreInfo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(buildMovieUrl());
  };
  
  const handleBookNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Scroll to showtimes section on movie details page
    navigate(`${buildMovieUrl()}#showtimes`);
  };
  
  const handleWatchTrailer = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowTrailer(true);
  };
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -6, scale: 1.02 }}
        transition={{ duration: 0.3 }}
        className="group relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link to={buildMovieUrl()} className="block">
          {/* Card Container */}
          <div className="relative glass glass-hover rounded-2xl overflow-hidden h-full">
            {/* Poster Image - Compact */}
            <div className="relative aspect-[2/3] overflow-hidden">
              <img 
                src={movie.posterUrl} 
                alt={movie.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              
              {/* Rating Badge */}
              <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 glass-strong rounded-lg">
                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                <span className="text-xs font-bold text-white">{movie.rating}</span>
              </div>
              
              {/* Genre Tag */}
              <div className="absolute top-2 left-2">
                <span className="px-2 py-1 liquid-gradient-subtle text-purple-300 rounded-lg text-xs font-medium">
                  {movie.genre[0]}
                </span>
              </div>
              
              {/* Quick Actions - Appear on Hover */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4"
                    style={{
                      background: 'rgba(0, 0, 0, 0.75)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    {/* Primary Action: Book Now */}
                    <button
                      onClick={handleBookNow}
                      className="w-full py-2.5 liquid-gradient hover:shadow-lg hover:shadow-purple-500/50 rounded-lg text-xs font-semibold transition-all duration-300 hover:scale-105 active:scale-95 text-white"
                    >
                      Купить билет
                    </button>
                    
                    {/* Secondary Action: More Info */}
                    <button
                      onClick={handleMoreInfo}
                      className="w-full py-2 glass glass-hover rounded-lg text-xs font-semibold transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 text-white"
                    >
                      <Info className="w-3 h-3" />
                      Подробнее
                    </button>
                    
                    {/* Tertiary Action: Watch Trailer */}
                    <button
                      onClick={handleWatchTrailer}
                      className="w-full py-2 flex items-center justify-center gap-1.5 text-white/70 hover:text-white text-xs font-medium transition-all duration-300 hover:scale-105"
                    >
                      <Play className="w-3 h-3" />
                      Смотреть трейлер
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Card Content - Compact (NO BUTTON) */}
            <div className="p-3">
              <h3 className="font-bold text-sm mb-1 line-clamp-1 group-hover:text-purple-300 transition-colors">
                {movie.title}
              </h3>
              
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{movie.duration}m</span>
                </div>
                <span className="truncate">{movie.genre.slice(1, 2).join('')}</span>
              </div>
            </div>
            
            {/* Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/30 to-pink-500/0 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
          </div>
        </Link>
      </motion.div>
      
      {/* Trailer Modal */}
      <TrailerModal
        isOpen={showTrailer}
        onClose={() => setShowTrailer(false)}
        videoUrl={movie.trailerUrl}
        title={movie.title}
      />
    </>
  );
}