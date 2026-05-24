import {
  useParams,
  useNavigate,
  useSearchParams,
} from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  Clock,
  Star,
  Play,
  User2,
  Video,
  MapPin,
  Navigation,
  Building2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import {
  movies,
  sessions,
  getCinemaById,
  getCinemasForMovie,
  getSessionsByMovie,
} from "../data/movies";
import { formatRub } from "../utils/formatRub";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { useCity } from "../contexts/CityContext";
import TrailerModal from "../components/TrailerModal";

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedCity } = useCity();
  const [searchParams] = useSearchParams();

  // Get cinema and date from URL parameters if available
  const cinemaFromUrl = searchParams.get("cinema");
  const dateFromUrl = searchParams.get("date");

  const [selectedCinema, setSelectedCinema] = useState<
    string | null
  >(cinemaFromUrl);
  const [selectedSession, setSelectedSession] = useState<
    string | null
  >(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    dateFromUrl || new Date().toISOString().split("T")[0],
  );
  const [showTrailer, setShowTrailer] = useState(false);
  const [isPosterHovered, setIsPosterHovered] = useState(false);

  // Scroll to showtimes section if hash is present
  useEffect(() => {
    if (window.location.hash === "#showtimes") {
      setTimeout(() => {
        const element = document.getElementById("showtimes");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  }, []);

  const movie = movies.find((m) => m.id === id);

  // Filter sessions and cinemas by selected city
  const allSessions = useMemo(() => {
    return getSessionsByMovie(id || "").filter((session) => {
      const cinema = getCinemaById(session.cinemaId);
      return cinema?.city === selectedCity;
    });
  }, [id, selectedCity]);

  const cinemasShowingMovie = useMemo(() => {
    return getCinemasForMovie(id || "").filter(
      (cinema) => cinema.city === selectedCity,
    );
  }, [id, selectedCity]);

  // Generate next 7 days for date selection
  const availableDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, []);

  // Filter sessions by date
  const filteredSessionsByDate = allSessions.filter(
    (s) => s.date === selectedDate,
  );

  // Group sessions by cinema
  const sessionsByCinema = useMemo(() => {
    const grouped = new Map();

    filteredSessionsByDate.forEach((session) => {
      if (!grouped.has(session.cinemaId)) {
        grouped.set(session.cinemaId, []);
      }
      grouped.get(session.cinemaId).push(session);
    });

    return grouped;
  }, [filteredSessionsByDate]);

  // Filter sessions by selected cinema and date
  const displaySessions = selectedCinema
    ? filteredSessionsByDate.filter(
        (s) => s.cinemaId === selectedCinema,
      )
    : filteredSessionsByDate;

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-lg">Фильм не найден</p>
      </div>
    );
  }

  const handleBooking = () => {
    if (!selectedSession) {
      toast.error("Пожалуйста, выберите время сеанса");
      return;
    }

    // Get the selected session's cinema to determine integration level
    const session = allSessions.find(
      (s) => s.id === selectedSession,
    );
    if (!session) return;

    const cinema = cinemasShowingMovie.find(
      (c) => c.id === session.cinemaId,
    );
    if (!cinema) return;

    // Determine integration level (session level overrides cinema level)
    const integrationLevel =
      session.integrationLevel || cinema.integrationLevel;

    // Route based on integration level
    switch (integrationLevel) {
      case 1:
        // Full seat selection
        navigate(
          `/movie/${id}/seats?session=${selectedSession}`,
        );
        break;
      case 2:
        // General admission
        navigate(
          `/movie/${id}/general-admission?session=${selectedSession}`,
        );
        break;
      case 3:
        // Phone booking only
        navigate(
          `/movie/${id}/phone-booking?session=${selectedSession}`,
        );
        break;
      default:
        navigate(
          `/movie/${id}/seats?session=${selectedSession}`,
        );
    }
  };

  const handleCinemaFilter = (cinemaId: string | null) => {
    setSelectedCinema(cinemaId);
    setSelectedSession(null);
  };

  return (
    <div className="min-h-screen pt-28">
      {/* Movie Info */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Sidebar - Fixed */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:fixed lg:w-[260px] xl:w-[300px] space-y-4"
            >
              {/* Back Button - Sticky */}
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm">Назад</span>
              </button>

              {/* Poster with Trailer on Hover */}
              <div
                className="glass rounded-2xl overflow-hidden relative group cursor-pointer"
                onMouseEnter={() => setIsPosterHovered(true)}
                onMouseLeave={() => setIsPosterHovered(false)}
              >
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full aspect-[2/3] object-cover group-hover:scale-110 transition-transform duration-700"
                />

                {/* Hover Overlay with Watch Trailer */}
                <AnimatePresence>
                  {isPosterHovered && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        background: "rgba(0, 0, 0, 0.7)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowTrailer(true)}
                        className="flex items-center gap-2 px-6 py-3 liquid-gradient hover:shadow-lg hover:shadow-purple-500/50 rounded-xl font-semibold transition-all duration-300"
                      >
                        <Play
                          className="w-5 h-5"
                          fill="white"
                        />
                        Смотреть трейлер
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Available Cinemas Info */}
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-purple-400" />
                  <h3 className="font-semibold text-sm">
                    Доступно в
                  </h3>
                </div>
                <p className="text-xl font-bold text-purple-400">
                  {cinemasShowingMovie.length}
                </p>
                <p className="text-xs text-gray-400">
                  кинотеатрах
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right Content - Scrollable */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-9 space-y-6"
          >
            {/* Title & Rating */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                {movie.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-full">
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  <span className="font-semibold text-white">
                    {movie.rating}
                  </span>
                  <span className="text-xs">/10</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{movie.duration} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(movie.releaseDate).getFullYear()}
                  </span>
                </div>
              </div>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {movie.genre.map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1.5 liquid-gradient-subtle text-purple-300 rounded-full text-sm font-medium"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Description */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-3">
                Описание
              </h2>
              <p className="text-gray-300 leading-relaxed">
                {movie.description}
              </p>
            </div>

            {/* Cast & Crew */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass rounded-xl p-4">
                <h3 className="font-bold mb-2 flex items-center gap-2 text-sm">
                  <Video className="w-4 h-4 text-purple-400" />
                  Режиссёр
                </h3>
                <p className="text-gray-300 text-sm">
                  {movie.director}
                </p>
              </div>
              <div className="glass rounded-xl p-4">
                <h3 className="font-bold mb-2 flex items-center gap-2 text-sm">
                  <User2 className="w-4 h-4 text-purple-400" />В
                  ролях
                </h3>
                <p className="text-gray-300 text-sm">
                  {movie.cast.join(", ")}
                </p>
              </div>
            </div>

            {/* Cinema Filter & Sessions */}
            <div
              className="glass-strong rounded-2xl p-6"
              id="showtimes"
            >
              <h3 className="text-xl font-bold mb-4">
                Выберите кинотеатр и сеанс
              </h3>

              {/* Date Selector */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <p className="text-sm font-semibold">
                    Выберите дату
                  </p>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {availableDates.map((date) => {
                    const dateStr = date
                      .toISOString()
                      .split("T")[0];
                    const isSelected = selectedDate === dateStr;
                    const isToday =
                      dateStr ===
                      new Date().toISOString().split("T")[0];

                    return (
                      <button
                        key={dateStr}
                        onClick={() => {
                          setSelectedDate(dateStr);
                          setSelectedSession(null);
                        }}
                        className={`p-2 rounded-lg transition-all text-center ${
                          isSelected
                            ? "liquid-gradient text-white"
                            : "glass glass-hover"
                        }`}
                      >
                        <div className="text-xs text-gray-400 mb-1">
                          {date.toLocaleDateString("en-US", {
                            weekday: "short",
                          })}
                        </div>
                        <div className="text-lg font-bold">
                          {date.getDate()}
                        </div>
                        {isToday && (
                          <div className="text-xs text-purple-400 mt-1">
                            Сегодня
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cinema Tabs */}
              <div className="flex overflow-x-auto gap-2 pb-3 mb-5 border-b border-white/10 scrollbar-hide">
                <button
                  onClick={() => handleCinemaFilter(null)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all text-sm ${
                    selectedCinema === null
                      ? "liquid-gradient text-white"
                      : "glass text-gray-400 hover:text-white"
                  }`}
                >
                  Все кинотеатры
                </button>
                {cinemasShowingMovie.map((cinema) => (
                  <button
                    key={cinema.id}
                    onClick={() =>
                      handleCinemaFilter(cinema.id)
                    }
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all text-sm ${
                      selectedCinema === cinema.id
                        ? "liquid-gradient text-white"
                        : "glass text-gray-400 hover:text-white"
                    }`}
                  >
                    {cinema.name}
                  </button>
                ))}
              </div>

              {/* Sessions Display */}
              {selectedCinema === null ? (
                <div className="space-y-4">
                  {Array.from(sessionsByCinema.entries()).map(
                    ([cinemaId, cinemaSessions]) => {
                      const cinema = getCinemaById(cinemaId);
                      if (!cinema) return null;

                      return (
                        <div
                          key={cinemaId}
                          className="glass rounded-xl p-4"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-bold mb-1 text-sm">
                                {cinema.name}
                              </h4>
                              <div className="flex items-center gap-3 text-xs text-gray-400">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span>{cinema.address}</span>
                                </div>
                                {cinema.distance && (
                                  <div className="flex items-center gap-1">
                                    <Navigation className="w-3 h-3" />
                                    <span>
                                      {cinema.distance}km
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                            {(
                              cinemaSessions as typeof allSessions
                            ).map((session) => (
                              <button
                                key={session.id}
                                onClick={() =>
                                  setSelectedSession(session.id)
                                }
                                className={`p-2 rounded-lg transition-all text-center ${
                                  selectedSession === session.id
                                    ? "liquid-gradient text-white"
                                    : "glass glass-hover"
                                }`}
                              >
                                <div className="text-sm font-bold">
                                  {session.time}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {formatRub(session.price)}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              ) : (
                <div>
                  {selectedCinema &&
                    (() => {
                      const cinema =
                        getCinemaById(selectedCinema);
                      return cinema ? (
                        <div className="mb-4 p-3 glass rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-sm">
                                {cinema.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {cinema.address}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}

                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    {displaySessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() =>
                          setSelectedSession(session.id)
                        }
                        className={`p-3 rounded-lg transition-all text-center ${
                          selectedSession === session.id
                            ? "liquid-gradient text-white"
                            : "glass glass-hover"
                        }`}
                      >
                        <div className="text-sm font-bold">
                          {session.time}
                        </div>
                        <div className="text-xs text-gray-400">
                          {session.hallName}
                        </div>
                        <div className="text-xs font-semibold text-purple-400 mt-1">
                          {formatRub(session.price)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleBooking}
                disabled={!selectedSession}
                className="w-full mt-5 py-3 liquid-gradient hover:shadow-lg hover:shadow-purple-500/50 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Перейти к выбору мест
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={showTrailer}
        onClose={() => setShowTrailer(false)}
        videoUrl={movie.trailerUrl}
        title={movie.title}
      />
    </div>
  );
}