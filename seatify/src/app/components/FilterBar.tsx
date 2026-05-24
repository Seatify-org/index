import { Filter, Search, X } from "lucide-react";
import { useState } from "react";

interface FilterBarProps {
  onGenreChange: (genre: string) => void;
  onSearchChange: (search: string) => void;
  selectedGenre: string;
}

const genres = ['Все', 'Боевик', 'Фантастика', 'Триллер', 'Ужасы', 'Приключения', 'Фэнтези', 'Романтика', 'Драма'];

export default function FilterBar({ onGenreChange, onSearchChange, selectedGenre }: FilterBarProps) {
  const [searchValue, setSearchValue] = useState('');
  
  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearchChange(value);
  };
  
  return (
    <div>
      {/* Search Bar */}
      <div className="relative mb-3">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Поиск фильмов..."
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-11 pr-11 py-2.5 glass text-sm text-white placeholder-gray-500 rounded-xl focus:outline-none focus:border-purple-500/50 transition-colors"
        />
        {searchValue && (
          <button
            onClick={() => handleSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Genre Filters - Compact */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
        {genres.map((genre) => (
          <button
            key={genre}
            onClick={() => onGenreChange(genre)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedGenre === genre
                ? 'liquid-gradient text-white shadow-lg shadow-purple-500/30'
                : 'glass text-gray-400 hover:text-white'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>
    </div>
  );
}
