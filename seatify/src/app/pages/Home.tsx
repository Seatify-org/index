import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin,
  Calendar,
  Search,
  Clock,
  Film,
  Star,
  Navigation,
  Zap,
  ChevronRight,
  X,
  Flame,
  Timer,
} from "lucide-react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import MovieCard from "../components/MovieCard";
import CityDropdown from "../components/CityDropdown";
import Footer from "../components/Footer";
import {
  movies,
  sessions,
  cinemas,
  getCinemaById,
} from "../data/movies";
import { useCity } from "../contexts/CityContext";
import { formatRub } from "../utils/formatRub";

export default function Home() {
  const [selectedGenre, setSelectedGenre] = useState("Все");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCinema, setSelectedCinema] = useState<
    string | null
  >(null);
  const { selectedCity, setSelectedCity } = useCity();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  ); // Store actual date string
  const [selectedCategory, setSelectedCategory] =
    useState("Все");
  const [scrolled, setScrolled] = useState(false);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [showAllCinemasModal, setShowAllCinemasModal] =
    useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Handle scroll for sticky bar morphing
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () =>
      window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keep currentTime fresh for Hot Sessions countdowns
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Auto-rotate hero movie
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroIndex(
        (prev) => (prev + 1) % Math.min(movies.length, 3),
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Generate next 7 days for date selector
  const availableDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split("T")[0],
        label:
          i === 0
            ? "Сегодня"
            : i === 1
              ? "Завтра"
              : date.toLocaleDateString("ru-RU", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                }),
      });
    }
    return dates;
  }, []);

  // Filter movies based on date - only show movies that have sessions on selected date in the selected city
  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      const matchesGenre =
        selectedGenre === "Все" ||
        movie.genre.includes(selectedGenre);
      const matchesSearch = movie.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // Check if movie has sessions on selected date in the selected city
      const movieSessionsOnDate = sessions.filter((s) => {
        const cinema = getCinemaById(s.cinemaId);
        return (
          s.movieId === movie.id &&
          s.date === selectedDate &&
          cinema?.city === selectedCity &&
          (!selectedCinema || s.cinemaId === selectedCinema)
        );
      });

      if (movieSessionsOnDate.length === 0) return false;

      return matchesGenre && matchesSearch;
    });
  }, [
    selectedGenre,
    searchQuery,
    selectedCinema,
    selectedDate,
    selectedCity,
  ]);

  // Filter sessions by date for "Available Near You" section
  const sessionsForSelectedDate = useMemo(() => {
    return sessions.filter((s) => s.date === selectedDate);
  }, [selectedDate]);

  const nearbyCinemas = cinemas
    .filter((c) => c.city === selectedCity)
    .slice(0, 4);

  // Get cinema data with session info
  const cinemasWithSessions = useMemo(() => {
    return cinemas
      .filter((c) => c.city === selectedCity)
      .map((cinema) => {
        const cinemaSessions = sessionsForSelectedDate.filter(
          (s) => s.cinemaId === cinema.id,
        );
        const movieGroups = cinemaSessions.reduce(
          (acc, session) => {
            if (!acc[session.movieId]) {
              acc[session.movieId] = [];
            }
            acc[session.movieId].push(session);
            return acc;
          },
          {} as Record<string, typeof cinemaSessions>,
        );

        return {
          cinema,
          sessions: cinemaSessions,
          movieGroups,
        };
      })
      .filter((item) => item.sessions.length > 0)
      .sort(
        (a, b) =>
          (a.cinema.distance || 0) - (b.cinema.distance || 0),
      );
  }, [selectedCity, sessionsForSelectedDate]);

  const nearestThreeCinemas = cinemasWithSessions.slice(0, 3);
  const remainingCinemas = cinemasWithSessions.slice(3);

  // Hot Sessions: starting within 3 hours OR seat availability < 20%
  const hotSessions = useMemo(() => {
    const todayStr = currentTime.toISOString().split("T")[0];

    const getTotalSeats = (hallName: string): number => {
      if (hallName.includes("IMAX")) return 216;
      if (hallName.includes("4DX")) return 126;
      if (hallName.includes("Premium")) return 48;
      return 96;
    };

    // Deterministic seat availability pattern per session
    const seatsPattern = [8, 60, 70, 80, 15, 45, 70, 80, 12, 60, 70, 45, 80, 18, 60, 70, 80, 45, 5, 70];
    const getSeatsPercent = (session: (typeof sessions)[0]): number => {
      const total = getTotalSeats(session.hallName);
      if (session.availableSeats !== undefined) {
        return Math.min(100, (session.availableSeats / total) * 100);
      }
      const idNum = parseInt(session.id.replace("s", "")) || 1;
      return seatsPattern[idNum % seatsPattern.length];
    };

    const result: Array<{
      session: (typeof sessions)[0];
      movie: (typeof movies)[0] | undefined;
      cinema: ReturnType<typeof getCinemaById>;
      badges: string[];
      urgencyScore: number;
      minutesUntilStart: number;
      seatsPercent: number;
    }> = [];

    for (const s of sessions) {
      if (s.date !== todayStr) continue;
      const cinema = getCinemaById(s.cinemaId);
      if (!cinema || cinema.city !== selectedCity) continue;

      const [h, min] = s.time.split(":").map(Number);
      const sessionTime = new Date(currentTime);
      sessionTime.setHours(h, min, 0, 0);
      const diffMin = (sessionTime.getTime() - currentTime.getTime()) / 60000;

      if (diffMin < -20) continue; // Started more than 20 min ago

      const seatsPercent = getSeatsPercent(s);
      const isStartingSoon = diffMin >= -20 && diffMin <= 180;
      const isAlmostSoldOut = seatsPercent <= 20;
      const isLastTickets = seatsPercent <= 10;

      if (!isStartingSoon && !isAlmostSoldOut) continue;

      const badges: string[] = [];
      if (isLastTickets) badges.push("last-tickets");
      else if (isAlmostSoldOut) badges.push("almost-sold-out");
      if (isStartingSoon) badges.push("starting-soon");

      // Lower score = more urgent
      let urgencyScore = 500;
      if (isLastTickets) urgencyScore -= 300;
      else if (isAlmostSoldOut) urgencyScore -= 150;
      if (diffMin >= 0 && diffMin <= 60) urgencyScore -= 200;
      else if (diffMin >= 0 && diffMin <= 180) urgencyScore -= 100;
      else if (diffMin < 0) urgencyScore -= 50;

      result.push({
        session: s,
        movie: movies.find((m) => m.id === s.movieId),
        cinema,
        badges,
        urgencyScore,
        minutesUntilStart: Math.floor(diffMin),
        seatsPercent,
      });
    }

    return result.sort((a, b) => a.urgencyScore - b.urgencyScore).slice(0, 12);
  }, [selectedCity, currentTime]);

  const genres = [
    "Все",
    "Боевик",
    "Фантастика",
    "Триллер",
    "Ужасы",
    "Приключения",
    "Фэнтези",
  ];

  const categories = [
    "Все",
    "Сегодня",
    "Завтра",
    "Скоро",
    "Пушкинская карта",
    "Детям",
    "Для вас",
    "Театр",
  ];

  const heroMovie = movies[currentHeroIndex];

  return (
    <div className="min-h-screen pt-24 bg-[#05050acc]">
      {/* Floating Control Bar - Sticky */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-20 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled ? "py-2" : "py-4"
        }`}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`glass-strong rounded-2xl transition-all duration-300 ${
              scrolled ? "p-3" : "p-4"
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* City Selector */}
              <div className="md:col-span-2">
                <CityDropdown
                  selectedCity={selectedCity}
                  onCityChange={setSelectedCity}
                />
              </div>

              {/* Cinema Selector */}
              <div className="md:col-span-3">
                <select
                  value={selectedCinema || ""}
                  onChange={(e) =>
                    setSelectedCinema(e.target.value || null)
                  }
                  className="w-full px-3 py-2 glass rounded-xl text-sm text-white bg-transparent focus:outline-none focus:border-purple-500/50 transition-colors cursor-pointer"
                >
                  <option value="" className="bg-[#1A1A22]">
                    Все кинотеатры
                  </option>
                  {cinemas
                    .filter((c) => c.city === selectedCity)
                    .map((cinema) => (
                      <option
                        key={cinema.id}
                        value={cinema.id}
                        className="bg-[#1A1A22]"
                      >
                        {cinema.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Date Selector */}
              <div className="md:col-span-2">
                <select
                  value={selectedDate}
                  onChange={(e) =>
                    setSelectedDate(e.target.value)
                  }
                  className="w-full px-3 py-2 glass rounded-xl text-sm text-white bg-transparent focus:outline-none focus:border-purple-500/50 transition-colors cursor-pointer"
                >
                  {availableDates.map((date) => (
                    <option
                      key={date.value}
                      value={date.value}
                      className="bg-[#1A1A22]"
                    >
                      {date.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Input */}
              <div className="md:col-span-5 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск фильмов..."
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(e.target.value)
                  }
                  className="w-full pl-10 pr-4 py-2 glass rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Spacer for Fixed Bar */}
      <div className={scrolled ? "h-20" : "h-28"} />

      {/* Hero Section - Compact Cinematic Panel */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentHeroIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="relative h-[280px] glass-strong rounded-3xl overflow-hidden group cursor-pointer hover:scale-[1.01] transition-transform duration-500"
            onClick={() => {
              const params = new URLSearchParams();
              if (selectedCinema)
                params.set("cinema", selectedCinema);
              if (selectedDate)
                params.set("date", selectedDate);
              const queryString = params.toString();
              window.location.href = `/movie/${heroMovie.id}${queryString ? `?${queryString}` : ""}`;
            }}
          >
            {/* Background Image Inside Glass */}
            <div className="absolute inset-0 bg-[#05050A]">
              <img
                src={heroMovie.bannerUrl}
                alt={heroMovie.title}
                className="w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex items-center px-8">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                    Популярное
                  </span>
                </div>

                <h2 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {heroMovie.title}
                </h2>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1 px-3 py-1 glass-strong rounded-full">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span className="font-bold text-sm">
                      {heroMovie.rating}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {heroMovie.genre
                      .slice(0, 2)
                      .map((genre) => (
                        <span
                          key={genre}
                          className="px-3 py-1 liquid-gradient-subtle text-purple-300 rounded-full text-xs font-medium"
                        >
                          {genre}
                        </span>
                      ))}
                  </div>

                  <span className="text-sm text-gray-400">
                    {heroMovie.duration} min
                  </span>
                </div>

                <p className="text-gray-300 text-sm mb-5 line-clamp-2 max-w-lg">
                  {heroMovie.description}
                </p>

                <button className="px-6 py-2.5 liquid-gradient hover:shadow-lg hover:shadow-purple-500/50 rounded-xl font-semibold transition-all duration-300 text-sm">
                  Купить билет
                </button>
              </div>
            </div>

            {/* Pagination Dots */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              {[0, 1, 2].map((index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentHeroIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentHeroIndex === index
                      ? "w-6 liquid-gradient"
                      : "glass"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Smart Filters Row */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="space-y-3">
          {/* Genres */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Film className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedGenre === genre
                    ? "liquid-gradient text-white shadow-lg shadow-purple-500/30"
                    : "glass glass-hover text-gray-400"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Categories Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Zap className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
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
      </section>

      {/* Movies Grid - High Density */}
      <section
        id="movies"
        className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-12"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {selectedGenre === "Все"
              ? "Все фильмы"
              : `${selectedGenre}`}
          </h2>
          <span className="text-gray-400 text-sm">
            {filteredMovies.length}{" "}
            {filteredMovies.length === 1
              ? "фильм"
              : filteredMovies.length < 5
                ? "фильма"
                : "фильмов"}
          </span>
        </div>

        {filteredMovies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                selectedCinema={selectedCinema}
                selectedDate={selectedDate}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="glass rounded-2xl p-8 inline-block">
              <p className="text-gray-400 text-lg">
                Фильмы не найдены по вашим критериям.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Cinema-Based Sessions Preview - "Available Near You" */}
      <section
        id="cinemas"
        className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-12"
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-400" />
            <h2 className="text-2xl font-bold">Рядом с вами</h2>
            <span className="text-sm text-gray-400">
              ({selectedCity})
            </span>
          </div>
          <div className="text-sm text-gray-400">
            {
              availableDates.find(
                (d) => d.value === selectedDate,
              )?.label
            }
          </div>
        </div>

        {cinemasWithSessions.length === 0 ? (
          <div className="glass-strong rounded-2xl p-12 text-center">
            <p className="text-gray-400">
              Нет кинотеатров на выбранную дату
            </p>
          </div>
        ) : (
          <>
            {/* First 3 Nearest Cinemas - Horizontal Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {nearestThreeCinemas.map(
                ({
                  cinema,
                  sessions: cinemaSessions,
                  movieGroups,
                }) => (
                  <div
                    key={cinema.id}
                    className="glass-strong rounded-2xl p-4 flex flex-col h-full"
                  >
                    {/* Cinema Header */}
                    <div className="mb-3 pb-3 border-b border-white/10">
                      <h3
                        className="font-bold mb-1 cursor-pointer hover:text-purple-400 transition-colors"
                        onClick={() =>
                          (window.location.href = `/cinema/${cinema.id}`)
                        }
                      >
                        {cinema.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                        <Navigation className="w-3 h-3" />
                        <span>{cinema.distance} км</span>
                        <span>•</span>
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span>{cinema.rating}</span>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {cinema.facilities
                          .slice(0, 3)
                          .map((facility) => (
                            <span
                              key={facility}
                              className="px-2 py-0.5 liquid-gradient-subtle text-purple-300 rounded text-xs"
                            >
                              {facility}
                            </span>
                          ))}
                      </div>
                    </div>

                    {/* Movies Preview - Compact */}
                    <div className="flex-1 space-y-2 mb-3">
                      {Object.entries(movieGroups)
                        .slice(0, 3)
                        .map(([movieId, movieSessions]) => {
                          const movie = movies.find(
                            (m) => m.id === movieId,
                          );
                          if (!movie) return null;

                          return (
                            <div
                              key={movieId}
                              className="glass rounded-lg p-2"
                            >
                              <div className="flex items-center gap-2 mb-1.5">
                                <div
                                  className="w-10 h-14 rounded overflow-hidden flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
                                  onClick={() =>
                                    (window.location.href = `/movie/${movie.id}`)
                                  }
                                >
                                  <img
                                    src={movie.posterUrl}
                                    alt={movie.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4
                                    className="font-semibold text-xs truncate cursor-pointer hover:text-purple-400 transition-colors"
                                    onClick={() =>
                                      (window.location.href = `/movie/${movie.id}`)
                                    }
                                  >
                                    {movie.title}
                                  </h4>
                                  <div className="text-xs text-gray-400">
                                    {movie.duration} min
                                  </div>
                                </div>
                              </div>
                              {/* Quick Showtimes */}
                              <div className="flex gap-1.5 flex-wrap">
                                {movieSessions
                                  .slice(0, 3)
                                  .map((session) => (
                                    <button
                                      key={session.id}
                                      onClick={() =>
                                        (window.location.href = `/movie/${movie.id}/seats?session=${session.id}`)
                                      }
                                      className="px-2 py-1 glass glass-hover rounded text-xs font-semibold hover:liquid-gradient transition-all"
                                    >
                                      {session.time}
                                    </button>
                                  ))}
                                {movieSessions.length > 3 && (
                                  <span className="px-2 py-1 text-xs text-gray-400">
                                    +{movieSessions.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}

                      {Object.keys(movieGroups).length > 3 && (
                        <p className="text-xs text-gray-400 text-center pt-1">
                          +{Object.keys(movieGroups).length - 3}{" "}
                          more movies
                        </p>
                      )}
                    </div>

                    {/* Full Schedule Button */}
                    <button
                      onClick={() =>
                        (window.location.href = `/cinema/${cinema.id}`)
                      }
                      className="w-full py-2.5 liquid-gradient hover:shadow-lg hover:shadow-purple-500/50 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1"
                    >
                      Full Schedule
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ),
              )}
            </div>

            {/* Remaining Cinemas - Carousel */}
            {remainingCinemas.length > 0 && (
              <div className="glass-strong rounded-2xl p-4">
                <h3 className="font-bold mb-3 text-sm text-gray-300">
                  Другие кинотеатры
                </h3>
                <Slider
                  dots={false}
                  infinite={false}
                  speed={500}
                  slidesToShow={Math.min(
                    3,
                    remainingCinemas.length,
                  )}
                  slidesToScroll={1}
                  responsive={[
                    {
                      breakpoint: 1024,
                      settings: {
                        slidesToShow: Math.min(
                          2,
                          remainingCinemas.length,
                        ),
                      },
                    },
                    {
                      breakpoint: 640,
                      settings: {
                        slidesToShow: 1,
                      },
                    },
                  ]}
                  className="cinema-carousel"
                >
                  {remainingCinemas.map(
                    ({
                      cinema,
                      sessions: cinemaSessions,
                      movieGroups,
                    }) => (
                      <div key={cinema.id} className="px-2">
                        <div className="glass rounded-xl p-4 h-full">
                          {/* Cinema Header */}
                          <div className="mb-3 pb-3 border-b border-white/10">
                            <h3
                              className="font-bold text-sm mb-1 cursor-pointer hover:text-purple-400 transition-colors truncate"
                              onClick={() =>
                                (window.location.href = `/cinema/${cinema.id}`)
                              }
                            >
                              {cinema.name}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                              <Navigation className="w-3 h-3" />
                              <span>{cinema.distance}km</span>
                              <span>•</span>
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              <span>{cinema.rating}</span>
                            </div>
                            <div className="flex gap-1">
                              {cinema.facilities
                                .slice(0, 2)
                                .map((facility) => (
                                  <span
                                    key={facility}
                                    className="px-2 py-0.5 liquid-gradient-subtle text-purple-300 rounded text-xs"
                                  >
                                    {facility}
                                  </span>
                                ))}
                            </div>
                          </div>

                          {/* Compact Movies List */}
                          <div className="space-y-2 mb-3">
                            {Object.keys(movieGroups)
                              .slice(0, 2)
                              .map((movieId) => {
                                const movie = movies.find(
                                  (m) => m.id === movieId,
                                );
                                if (!movie) return null;

                                return (
                                  <div
                                    key={movieId}
                                    className="text-xs"
                                  >
                                    <div
                                      className="font-semibold truncate cursor-pointer hover:text-purple-400 transition-colors"
                                      onClick={() =>
                                        (window.location.href = `/movie/${movie.id}`)
                                      }
                                    >
                                      {movie.title}
                                    </div>
                                  </div>
                                );
                              })}
                            <p className="text-xs text-gray-400">
                              {Object.keys(movieGroups).length}{" "}
                              movies • {cinemaSessions.length}{" "}
                              shows
                            </p>
                          </div>

                          {/* Full Schedule Button */}
                          <button
                            onClick={() =>
                              (window.location.href = `/cinema/${cinema.id}`)
                            }
                            className="w-full py-2 glass glass-hover rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1"
                          >
                            Full Schedule
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ),
                  )}
                </Slider>

                {/* View All Button - Show when more than 6 cinemas total */}
                {cinemasWithSessions.length > 6 && (
                  <button
                    onClick={() => setShowAllCinemasModal(true)}
                    className="w-full mt-4 py-3 liquid-gradient hover:shadow-lg hover:shadow-purple-500/50 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    View All {cinemasWithSessions.length}{" "}
                    Cinemas
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {/* All Cinemas Modal */}
      <AnimatePresence>
        {showAllCinemasModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-strong rounded-2xl p-6 max-w-6xl w-full max-h-[80vh] overflow-y-auto custom-scrollbar"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor:
                  "#7C5CFF rgba(255, 255, 255, 0.1)",
              }}
            >
              {/* Modal Header */}
              <div
                className="flex items-center justify-between mb-6 -mt-6 -mx-6 px-6 py-4 rounded-t-2xl border-b border-white/10"
                style={{
                  background: "rgba(10, 10, 15, 0.98)",
                  backdropFilter: "blur(40px)",
                }}
              >
                <div>
                  <h2 className="text-2xl font-bold">
                    Все кинотеатры в {selectedCity}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {cinemasWithSessions.length} cinemas showing
                    movies on{" "}
                    {
                      availableDates.find(
                        (d) => d.value === selectedDate,
                      )?.label
                    }
                  </p>
                </div>
                <button
                  onClick={() => setShowAllCinemasModal(false)}
                  className="w-10 h-10 rounded-full glass glass-hover flex items-center justify-center transition-all hover:scale-110"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* All Cinemas Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cinemasWithSessions.map(
                  ({
                    cinema,
                    sessions: cinemaSessions,
                    movieGroups,
                  }) => (
                    <div
                      key={cinema.id}
                      className="glass rounded-xl p-4 flex flex-col h-full hover:bg-white/5 transition-all"
                    >
                      {/* Cinema Header */}
                      <div className="mb-3 pb-3 border-b border-white/10">
                        <h3
                          className="font-bold mb-1 cursor-pointer hover:text-purple-400 transition-colors"
                          onClick={() => {
                            window.location.href = `/cinema/${cinema.id}`;
                          }}
                        >
                          {cinema.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                          <Navigation className="w-3 h-3" />
                          <span>{cinema.distance} км</span>
                          <span>•</span>
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span>{cinema.rating}</span>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {cinema.facilities
                            .slice(0, 3)
                            .map((facility) => (
                              <span
                                key={facility}
                                className="px-2 py-0.5 liquid-gradient-subtle text-purple-300 rounded text-xs"
                              >
                                {facility}
                              </span>
                            ))}
                        </div>
                      </div>

                      {/* Cinema Stats */}
                      <div className="flex-1">
                        <p className="text-sm text-gray-400 mb-2">
                          {Object.keys(movieGroups).length}{" "}
                          movies • {cinemaSessions.length} shows
                        </p>
                        <div className="space-y-1">
                          {Object.keys(movieGroups)
                            .slice(0, 4)
                            .map((movieId) => {
                              const movie = movies.find(
                                (m) => m.id === movieId,
                              );
                              if (!movie) return null;

                              return (
                                <div
                                  key={movieId}
                                  className="text-xs text-gray-400 truncate cursor-pointer hover:text-purple-400 transition-colors"
                                  onClick={() => {
                                    window.location.href = `/movie/${movie.id}`;
                                  }}
                                >
                                  • {movie.title}
                                </div>
                              );
                            })}
                          {Object.keys(movieGroups).length >
                            4 && (
                            <p className="text-xs text-gray-500">
                              +
                              {Object.keys(movieGroups).length -
                                4}{" "}
                              more
                            </p>
                          )}
                        </div>
                      </div>

                      {/* View Schedule Button */}
                      <button
                        onClick={() => {
                          window.location.href = `/cinema/${cinema.id}`;
                        }}
                        className="w-full mt-3 py-2.5 liquid-gradient hover:shadow-lg hover:shadow-purple-500/50 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1"
                      >
                        Расписание
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ),
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hot Sessions Section */}
      <section
        id="showtimes"
        className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-12"
      >
        <div className="glass-strong rounded-2xl p-6">
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-2 rounded-full bg-orange-500/25 blur-md animate-pulse" />
              <Flame className="relative w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Горящие сеансы</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Скоро начинаются · Ограниченное количество мест
              </p>
            </div>
            {hotSessions.length > 0 && (
              <span className="ml-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/15 border border-orange-500/30 text-orange-300 animate-pulse">
                {hotSessions.length}
              </span>
            )}
          </div>

          {hotSessions.length === 0 ? (
            <div className="py-10 text-center">
              <Flame className="w-10 h-10 text-gray-600 mx-auto mb-3 opacity-40" />
              <p className="text-gray-400 text-sm font-medium">
                Горящих сеансов пока нет
              </p>
              <p className="text-gray-500 text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
                Здесь появятся сеансы, начинающиеся в ближайшие 3 часа, или с ограниченным числом мест
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 pb-2">
              <div className="flex gap-3" style={{ width: "max-content" }}>
                {hotSessions.map(
                  ({
                    session,
                    movie,
                    cinema,
                    badges,
                    minutesUntilStart,
                    seatsPercent,
                  }) => {
                    const isLastTickets = badges.includes("last-tickets");
                    const isAlmostSoldOut = badges.includes("almost-sold-out");
                    const isStartingSoon = badges.includes("starting-soon");
                    const isOngoing = minutesUntilStart < 0;

                    const borderGlow = isLastTickets
                      ? "border-red-500/40 shadow-[0_0_24px_rgba(239,68,68,0.18)]"
                      : isAlmostSoldOut
                        ? "border-orange-500/40 shadow-[0_0_24px_rgba(249,115,22,0.18)]"
                        : "border-amber-500/25";

                    const timeLabel = isOngoing
                      ? "Идёт сеанс"
                      : minutesUntilStart <= 60
                        ? `Через ${minutesUntilStart} мин`
                        : (() => {
                            const hrs = Math.floor(minutesUntilStart / 60);
                            const mins = minutesUntilStart % 60;
                            return mins > 0
                              ? `Через ${hrs}ч ${mins}мин`
                              : `Через ${hrs}ч`;
                          })();

                    return (
                      <motion.button
                        key={session.id}
                        onClick={() =>
                          (window.location.href = `/movie/${session.movieId}/seats?session=${session.id}`)
                        }
                        className={`w-[252px] flex-shrink-0 glass rounded-xl overflow-hidden text-left border transition-all ${borderGlow}`}
                        whileHover={{ y: -4, scale: 1.02 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                        }}
                      >
                        {/* Urgency Badges */}
                        <div className="flex flex-wrap gap-1.5 px-3 pt-3">
                          {isLastTickets && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 border border-red-500/40 rounded-full text-[10px] font-bold text-red-400 uppercase tracking-wide">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
                              Последние билеты
                            </span>
                          )}
                          {!isLastTickets && isAlmostSoldOut && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 border border-orange-500/40 rounded-full text-[10px] font-bold text-orange-400 uppercase tracking-wide">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse inline-block" />
                              Почти нет мест
                            </span>
                          )}
                          {isStartingSoon && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 rounded-full text-[10px] font-bold text-amber-400 uppercase tracking-wide">
                              <Timer className="w-2.5 h-2.5" />
                              {timeLabel}
                            </span>
                          )}
                        </div>

                        {/* Card Body */}
                        <div className="p-3 flex gap-3">
                          {/* Movie Poster */}
                          <div className="w-14 h-[84px] rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-white/10">
                            {movie?.posterUrl ? (
                              <img
                                src={movie.posterUrl}
                                alt={movie.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                <Film className="w-5 h-5 text-gray-600" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm leading-tight truncate mb-0.5">
                              {movie?.title ?? "—"}
                            </h4>
                            <p className="text-[11px] text-gray-400 truncate mb-2">
                              {cinema?.name ?? "—"}
                            </p>

                            {/* Time & Price */}
                            <div className="flex items-center justify-between mb-2.5">
                              <span className="text-purple-300 font-bold text-base">
                                {session.time}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatRub(session.price)}
                              </span>
                            </div>

                            {/* Seat availability bar */}
                            <div>
                              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    isLastTickets
                                      ? "bg-gradient-to-r from-red-600 to-red-400"
                                      : isAlmostSoldOut
                                        ? "bg-gradient-to-r from-orange-600 to-orange-400"
                                        : "bg-gradient-to-r from-emerald-600 to-emerald-400"
                                  }`}
                                  style={{
                                    width: `${Math.min(seatsPercent, 100)}%`,
                                  }}
                                />
                              </div>
                              <p
                                className={`text-[10px] mt-1 font-medium ${
                                  isLastTickets
                                    ? "text-red-400"
                                    : isAlmostSoldOut
                                      ? "text-orange-400"
                                      : "text-gray-400"
                                }`}
                              >
                                {Math.round(seatsPercent)}% мест осталось
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    );
                  },
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Offers Section */}
      <section
        id="offers"
        className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-12"
      >
        <div className="glass-strong rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-bold">
              Специальные предложения
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative glass rounded-xl p-6 overflow-hidden group hover:scale-105 transition-transform cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />
              <div className="relative">
                <div className="text-xs text-purple-400 font-semibold mb-2">
                  ВЫХОДНЫЕ
                </div>
                <h3 className="text-lg font-bold mb-2">
                  1+1 бесплатно
                </h3>
                <p className="text-sm text-gray-400 mb-3">
                  На все сеансы выходного дня. Действует только
                  на стандартные места.
                </p>
                <span className="text-xs liquid-gradient-subtle text-purple-300 px-3 py-1 rounded-full inline-block">
                  Действует до воскресенья
                </span>
              </div>
            </div>

            <div className="relative glass rounded-xl p-6 overflow-hidden group hover:scale-105 transition-transform cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl" />
              <div className="relative">
                <div className="text-xs text-pink-400 font-semibold mb-2">
                  СТУДЕНЧЕСКАЯ СКИДКА
                </div>
                <h3 className="text-lg font-bold mb-2">
                  30% скидка
                </h3>
                <p className="text-sm text-gray-400 mb-3">
                  Предъявите студенческий билет в кассе. Все
                  сеансы, каждый день.
                </p>
                <span className="text-xs liquid-gradient-subtle text-pink-300 px-3 py-1 rounded-full inline-block">
                  Постоянная акция
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}