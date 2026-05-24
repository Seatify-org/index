import {
  useParams,
  useNavigate,
  useSearchParams,
} from "react-router";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Phone,
  Clock,
  MapPin,
  Building2,
  AlertCircle,
  Calendar,
  Film,
} from "lucide-react";
import {
  movies,
  sessions,
  getCinemaById,
} from "../data/movies";
import { formatRub } from "../utils/formatRub";

export default function PhoneBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session");

  const movie = movies.find((m) => m.id === id);
  const session = sessions.find((s) => s.id === sessionId);
  const cinema = session
    ? getCinemaById(session.cinemaId)
    : null;

  if (!movie || !session || !cinema || !cinema.phoneNumber) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-lg">Сеанс не найден</p>
      </div>
    );
  }

  const handlePhoneCall = () => {
    window.location.href = `tel:${cinema.phoneNumber}`;
  };

  return (
    <div className="min-h-screen pt-28 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(`/movie/${id}`)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Назад к фильму</span>
          </button>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-3xl p-8 space-y-8"
        >
          {/* Phone Booking Icon */}
          <div className="text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-orange-500/20 blur-3xl" />
              <div className="relative w-24 h-24 mx-auto liquid-gradient-subtle rounded-2xl flex items-center justify-center">
                <Phone className="w-12 h-12 text-orange-400" />
              </div>
            </div>

            <h1 className="text-3xl font-bold mb-3">
              Требуется бронирование по телефону
            </h1>
            <p className="text-gray-400 max-w-md mx-auto">
              Этот кинотеатр использует традиционные методы
              бронирования. Пожалуйста, позвоните в их кассу для
              резервирования билетов.
            </p>
          </div>

          {/* Info Notice */}
          <div className="glass rounded-xl p-4 border border-orange-500/20 flex gap-3">
            <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-300">
                <strong className="text-orange-400">
                  Примечание:
                </strong>{" "}
                Онлайн-оплата недоступна для этого кинотеатра.
                Вы можете оплатить в кассе при получении
                билетов.
              </p>
            </div>
          </div>

          {/* Movie & Session Details */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold text-lg mb-4">
              Детали бронирования
            </h3>

            <div className="flex items-start gap-3">
              <Film className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-400">Фильм</p>
                <p className="font-semibold">{movie.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {movie.genre.join(", ")} • {movie.duration}{" "}
                  min
                </p>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-400">
                  Кинотеатр
                </p>
                <p className="font-semibold">{cinema.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {session.hallName}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-400">Адрес</p>
                <p className="text-sm">{cinema.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-400">
                  Дата и время
                </p>
                <p className="font-semibold">
                  {new Date(session.date).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  )}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Showtime: {session.time}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-400">
                  Базовая цена билета
                </p>
                <p className="font-semibold text-lg">
                  {formatRub(session.price)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Окончательная цена может отличаться. Уточните
                  при звонке.
                </p>
              </div>
            </div>
          </div>

          {/* Call Button */}
          <button
            onClick={handlePhoneCall}
            className="w-full py-4 liquid-gradient hover:shadow-lg hover:shadow-orange-500/50 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 text-lg"
          >
            <Phone className="w-6 h-6" />
            Позвонить {cinema.phoneNumber}
          </button>

          {/* Instructions */}
          <div className="glass-strong rounded-xl p-5 space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <span className="w-6 h-6 rounded-full liquid-gradient flex items-center justify-center text-xs">
                💡
              </span>
              Когда вы будете звонить, приготовьте следующую
              информацию:
            </h4>

            <ul className="space-y-2 text-sm text-gray-300 ml-8">
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>
                  Название фильма:{" "}
                  <strong className="text-white">
                    {movie.title}
                  </strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>
                  Дата:{" "}
                  <strong className="text-white">
                    {new Date(session.date).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric" },
                    )}
                  </strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>
                  Время:{" "}
                  <strong className="text-white">
                    {session.time}
                  </strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>
                  Количество билетов, которое вам нужно
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>Ваша контактная информация</span>
              </li>
            </ul>
          </div>

          {/* Alternative Action */}
          <div className="text-center pt-4">
            <button
              onClick={() => navigate(`/cinema/${cinema.id}`)}
              className="text-purple-400 hover:text-purple-300 transition-colors text-sm font-medium"
            >
              Посмотреть все сеансы в {cinema.name} →
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}