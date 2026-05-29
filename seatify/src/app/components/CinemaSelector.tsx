import { useState, useEffect } from "react";
import { MapPin, X, Navigation, Star, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cinemas, cities, type Cinema } from "../data/movies";

interface CinemaSelectorProps {
  selectedCinema: string | null;
  onCinemaSelect: (cinemaId: string | null) => void;
  selectedCity: string;
  onCityChange: (city: string) => void;
}

export default function CinemaSelector({ 
  selectedCinema, 
  onCinemaSelect, 
  selectedCity, 
  onCityChange 
}: CinemaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'city'>('list');
  
  const filteredCinemas = selectedCity === 'Все города'
    ? cinemas
    : cinemas.filter(c => c.city === selectedCity);
  
  const selectedCinemaData = selectedCinema 
    ? cinemas.find(c => c.id === selectedCinema) 
    : null;
  
  const handleDetectLocation = () => {
    // Simulate location detection
    onCityChange('Москва');
    setViewMode('list');
  };
  
  const handleCinemaClick = (cinemaId: string) => {
    onCinemaSelect(cinemaId === selectedCinema ? null : cinemaId);
    setIsOpen(false);
  };
  
  return (
    <>
      {/* Selector Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 px-4 py-2.5 glass glass-hover rounded-xl transition-all group w-full md:w-auto"
      >
        <div className="flex items-center gap-2 flex-1">
          <MapPin className="w-4 h-4 text-purple-400" />
          <div className="text-left">
            <p className="text-xs text-gray-400">Кинотеатр</p>
            <p className="font-semibold text-sm">
              {selectedCinemaData ? selectedCinemaData.name : 'Все кинотеатры'}
            </p>
          </div>
        </div>
        {selectedCinemaData && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Navigation className="w-3 h-3" />
            {selectedCinemaData.distance}km
          </div>
        )}
      </button>
      
      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[80vh] glass-strong rounded-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Выберите кинотеатр</h2>
                  <p className="text-sm text-gray-400">Выберите предпочитаемое место</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 glass glass-hover rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* View Mode Tabs */}
              <div className="flex items-center gap-2 p-4 border-b border-white/5">
                <button
                  onClick={handleDetectLocation}
                  className="flex items-center gap-2 px-4 py-2 liquid-gradient-subtle hover:liquid-gradient text-purple-300 hover:text-white rounded-lg transition-all text-sm"
                >
                  <Navigation className="w-4 h-4" />
                  Определить местоположение
                </button>
                
                <div className="flex-1" />
                
                <button
                  onClick={() => setViewMode('city')}
                  className={`px-4 py-2 rounded-lg transition-all text-sm ${
                    viewMode === 'city' 
                      ? 'liquid-gradient text-white' 
                      : 'glass text-gray-400 hover:text-white'
                  }`}
                >
                  By City
                  По городам
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg transition-all text-sm ${
                    viewMode === 'list'
                      ? 'liquid-gradient text-white'
                      : 'glass text-gray-400 hover:text-white'
                  }`}
                >
                  All Cinemas
                  Все кинотеатры
                </button>
              </div>
              
              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(80vh-180px)] p-6">
                {viewMode === 'city' ? (
                  <div className="space-y-3">
                    {['Все города', ...cities].map((city) => (
                      <button
                        key={city}
                        onClick={() => {
                          onCityChange(city);
                          setViewMode('list');
                        }}
                        className="w-full p-4 glass glass-hover rounded-xl transition-all text-left group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 liquid-gradient-subtle rounded-lg flex items-center justify-center">
                              <Building2 className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                              <p className="font-semibold">{city}</p>
                              <p className="text-sm text-gray-400">
                                {city === 'Все города'
                                  ? `${cinemas.length} кинотеатров`
                                  : `${cinemas.filter(c => c.city === city).length} кинотеатров`}
                              </p>
                            </div>
                          </div>
                          <div className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            →
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* All Cinemas Option */}
                    <button
                      onClick={() => handleCinemaClick('')}
                      className={`w-full p-4 rounded-xl transition-all text-left ${
                        !selectedCinema
                          ? 'glass-strong border-2 border-purple-500/50'
                          : 'glass glass-hover'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 liquid-gradient rounded-lg flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-lg">Все кинотеатры</p>
                          <p className="text-sm text-gray-400">Показать фильмы из всех локаций</p>
                        </div>
                      </div>
                    </button>
                    
                    {/* Cinema List */}
                    {filteredCinemas.map((cinema) => (
                      <CinemaCard
                        key={cinema.id}
                        cinema={cinema}
                        isSelected={selectedCinema === cinema.id}
                        onClick={() => handleCinemaClick(cinema.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function CinemaCard({ 
  cinema, 
  isSelected, 
  onClick 
}: { 
  cinema: Cinema; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-xl transition-all text-left group ${
        isSelected
          ? 'glass-strong border-2 border-purple-500/50'
          : 'glass glass-hover'
      }`}
    >
      <div className="flex gap-3">
        {/* Cinema Image */}
        <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0">
          <img 
            src={cinema.imageUrl} 
            alt={cinema.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        </div>
        
        {/* Cinema Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-sm truncate">{cinema.name}</h3>
            <div className="flex items-center gap-1 text-xs flex-shrink-0">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span>{cinema.rating}</span>
            </div>
          </div>
          
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{cinema.address}</span>
            </div>
            
            {cinema.distance && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Navigation className="w-3 h-3 flex-shrink-0" />
                <span>{cinema.distance} км</span>
              </div>
            )}
          </div>
          
          {/* Facilities */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {cinema.facilities.slice(0, 2).map((facility) => (
              <span 
                key={facility}
                className="px-2 py-0.5 liquid-gradient-subtle text-purple-300 text-xs rounded"
              >
                {facility}
              </span>
            ))}
            {cinema.facilities.length > 2 && (
              <span className="px-2 py-0.5 text-gray-500 text-xs">
                +{cinema.facilities.length - 2}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}