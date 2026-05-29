import { useState, useMemo, useEffect } from "react";
import { Navigate } from "react-router"; // Импортируем Navigate для редиректа
import {
  Plus, Edit2, Trash2, Film, Clock, ChevronDown, Save,
  Layers, Search, Building2, Ticket, Copy, Check, X,
  MapPin, Star, Calendar, Loader2
} from "lucide-react";
import { formatRub } from "../utils/formatRub";
import { toast } from "sonner";
// Импортируем типы и API функции
import { fetchMovies, fetchSessionsByMovie, type Movie as ApiMovie, type Session as ApiSession } from "../services/api";
import { useAuth } from "../contexts/AuthContext"; // Импортируем хук авторизации

// ─── Constants & Helpers ──────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split("T")[0];

const SHORT_DATE = (d: string) =>
  new Date(d + "T00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

const PRICE_STEPS = [99,149,199,249,299,349,399,449,499,549,599,649,699,749,799,849,899,949,999,1099,1199,1299,1399,1499];
const snapPrice = (n: number) =>
  PRICE_STEPS.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a));

// ─── Extended Types for Frontend ──────────────────────────────────────────────

interface ExtendedMovie extends ApiMovie {
  genre: string[];
  rating: number;
  posterUrl: string;
  bannerUrl?: string;
  trailerUrl?: string;
  cast: string[];
  director: string;
  duration: number;
  releaseDate: string;
}

interface ExtendedSession extends ApiSession {
  id: string;
  movieId: string;
  cinemaId: string;
  hallId: string;
  hallName: string;
  date: string;
  time: string;
  price: number;
  integrationLevel: 1 | 2 | 3;
}

interface ExtendedCinema {
  id: string;
  name: string;
  address: string;
  city: string;
  rating: number;
  distance?: number;
  latitude?: number;
  longitude?: number;
  facilities: string[];
  totalHalls: number;
  imageUrl?: string;
  integrationLevel: 1 | 2 | 3;
  phoneNumber?: string;
  infrastructureTags?: string[];
}

// ─── API Functions (Mocked until backend implements Admin endpoints) ──────────

const apiRequest = async (url: string, method: string, body?: any) => {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
  return res.json();
};

// Заглушки CRUD операций
const createMovieApi = async (data: any) => {
  console.log("Creating movie:", data);
  return { ...data, id: Date.now() };
};

const updateMovieApi = async (id: string, data: any) => {
  console.log("Updating movie:", id, data);
  return { ...data, id: Number(id) };
};

const deleteMovieApi = async (id: string) => {
  console.log("Deleting movie:", id);
  return true;
};

const createSessionApi = async (data: any) => {
  console.log("Creating session:", data);
  return { ...data, id: Date.now() };
};

const updateSessionApi = async (id: string, data: any) => {
  console.log("Updating session:", id, data);
  return { ...data, id: Number(id) };
};

const deleteSessionApi = async (id: string) => {
  console.log("Deleting session:", id);
  return true;
};

const createCinemaApi = async (data: any) => {
  console.log("Creating cinema:", data);
  return { ...data, id: Date.now() };
};

const updateCinemaApi = async (id: string, data: any) => {
  console.log("Updating cinema:", id, data);
  return { ...data, id: Number(id) };
};

const deleteCinemaApi = async (id: string) => {
  console.log("Deleting cinema:", id);
  return true;
};

// ─── Root Component ───────────────────────────────────────────────────────────

type Tab = "movies" | "sessions" | "cinemas";

export default function Admin() {
  const { user, isAdmin, isLoading } = useAuth(); // Получаем данные о пользователе
  
  const [tab, setTab] = useState<Tab>("movies");
  
  // Data States
  const [moviesList, setMoviesList] = useState<ExtendedMovie[]>([]);
  const [cinemasList, setCinemasList] = useState<ExtendedCinema[]>([]);
  const [sessionsList, setSessionsList] = useState<ExtendedSession[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // ЗАЩИТА РОУТА: Если загрузка завершена и пользователь не админ — редирект
  if (!isLoading && (!user || !isAdmin())) {
    return <Navigate to="/" replace />;
  }

  // Load Data (только если пользователь админ)
  useEffect(() => {
    if (!user || !isAdmin()) return;

    const loadData = async () => {
      setDataLoading(true);
      try {
        // 1. Load Movies
        const apiMovies = await fetchMovies();
        const extendedMovies: ExtendedMovie[] = apiMovies.map(m => ({
          ...m,
          id: String(m.id),
          genre: ["Фантастика", "Боевик"], // Заглушка, если в API нет жанров
          rating: m.rating || 7.5,
          posterUrl: m.poster_url,
          duration: m.duration_minutes,
          releaseDate: m.release_date,
          cast: ["Актер 1", "Актер 2"],
          director: "Режиссер",
          bannerUrl: m.poster_url,
        }));
        setMoviesList(extendedMovies);

        // 2. Load Sessions for all movies
        const allSessionsPromises = apiMovies.map(m => fetchSessionsByMovie(m.id));
        const sessionsArrays = await Promise.all(allSessionsPromises);
        
        const flatSessions: ExtendedSession[] = sessionsArrays.flat().map((s, idx) => ({
          id: String(s.id),
          movieId: String(s.movie_id),
          cinemaId: String(s.cinema_id),
          hallId: String(s.hall_id),
          hallName: `Зал ${s.hall_id}`,
          date: new Date(s.start_time).toISOString().split('T')[0],
          time: new Date(s.start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          price: s.base_price_cents / 100,
          integrationLevel: 1,
        }));
        setSessionsList(flatSessions);

        // 3. Extract Cinemas from Sessions
        const cinemaMap = new Map<string, ExtendedCinema>();
        flatSessions.forEach(s => {
          if (!cinemaMap.has(s.cinemaId)) {
            cinemaMap.set(s.cinemaId, {
              id: s.cinemaId,
              name: `Кинотеатр ${s.cinemaId}`,
              address: "Адрес уточняется",
              city: "Москва",
              rating: 4.5,
              facilities: ["Wi-Fi"],
              totalHalls: 1,
              integrationLevel: 1,
            });
          }
        });
        setCinemasList(Array.from(cinemaMap.values()));

      } catch (error) {
        console.error("Failed to load admin data", error);
        toast.error("Не удалось загрузить данные админ-панели");
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [user]); // Перезагружаем при изменении пользователя

  const hallsMap = useMemo(() => {
    const map: Record<string, { id: string; name: string }[]> = {};
    sessionsList.forEach((s) => {
      if (!map[s.cinemaId]) map[s.cinemaId] = [];
      if (!map[s.cinemaId].find((h) => h.id === s.hallId)) {
        map[s.cinemaId].push({ id: s.hallId, name: s.hallName });
      }
    });
    return map;
  }, [sessionsList]);

  const todaySessions = useMemo(
    () => sessionsList.filter((s) => s.date === TODAY),
    [sessionsList]
  );
  
  const todayRevenue = useMemo(
    () => todaySessions.reduce((a, s) => a + s.price, 0),
    [todaySessions]
  );

  const TABS: { id: Tab; label: string; Icon: React.FC<any> }[] = [
    { id: "movies", label: "Фильмы", Icon: Film },
    { id: "sessions", label: "Сеансы", Icon: Clock },
    { id: "cinemas", label: "Кинотеатры", Icon: Building2 },
  ];

  // Показываем лоадер пока грузятся данные панели (после проверки прав)
  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
          <p className="text-gray-400">Загрузка админ-панели...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      {/* Sticky tab bar */}
      <div className="sticky top-16 z-40 glass border-b border-white/10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-[52px] flex items-center justify-between gap-4">
          <span className="text-sm text-gray-400 hidden sm:block font-medium">Seatify Admin</span>
          <nav className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/8">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  tab === id
                    ? "liquid-gradient text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Film size={18} className="text-purple-400" />, label: "Фильмов", value: String(moviesList.length) },
            { icon: <Clock size={18} className="text-emerald-400" />, label: "Сеансов сегодня", value: String(todaySessions.length) },
            { icon: <Building2 size={18} className="text-cyan-400" />, label: "Кинотеатров", value: String(cinemasList.length) },
            { icon: <Ticket size={18} className="text-yellow-400" />, label: "Выручка сегодня", value: formatRub(todayRevenue) },
          ].map((s) => (
            <div key={s.label} className="glass-strong rounded-2xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 liquid-gradient-subtle rounded-xl flex items-center justify-center shrink-0">
                {s.icon}
              </div>
              <div>
                <div className="text-[11px] text-gray-500 leading-none mb-0.5 uppercase tracking-wider">{s.label}</div>
                <div className="text-xl font-bold leading-tight">{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tab panels */}
        {tab === "movies" && (
          <MoviesTab
            movies={moviesList}
            setMovies={setMoviesList}
            sessions={sessionsList}
            setSessions={setSessionsList}
          />
        )}
        {tab === "sessions" && (
          <SessionsTab
            sessions={sessionsList}
            setSessions={setSessionsList}
            movies={moviesList}
            cinemas={cinemasList}
            hallsMap={hallsMap}
          />
        )}
        {tab === "cinemas" && (
          <CinemasTab
            cinemas={cinemasList}
            setCinemas={setCinemasList}
            hallsMap={hallsMap}
          />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOVIES TAB
// ═══════════════════════════════════════════════════════════════════════════════

function MoviesTab({
  movies,
  setMovies,
  sessions,
  setSessions,
}: {
  movies: ExtendedMovie[];
  setMovies: React.Dispatch<React.SetStateAction<ExtendedMovie[]>>;
  sessions: ExtendedSession[];
  setSessions: React.Dispatch<React.SetStateAction<ExtendedSession[]>>;
}) {
  const [search, setSearch] = useState("");
  const [panelMovie, setPanelMovie] = useState<ExtendedMovie | "new" | null>(null);

  const filtered = useMemo(
    () =>
      movies.filter(
        (m) =>
          m.title.toLowerCase().includes(search.toLowerCase()) ||
          m.director.toLowerCase().includes(search.toLowerCase())
      ),
    [movies, search]
  );

  const handleDelete = async (id: string) => {
    const count = sessions.filter((s) => s.movieId === id).length;
    const msg = count
      ? `С фильмом связано ${count} сеансов. Удалить фильм и все его сеансы?`
      : "Удалить фильм?";
    if (!window.confirm(msg)) return;
    
    try {
      await deleteMovieApi(id);
      setMovies((p) => p.filter((m) => m.id !== id));
      if (count) setSessions((p) => p.filter((s) => s.movieId !== id));
      toast.success("Фильм удалён");
    } catch (e) {
      toast.error("Ошибка при удалении фильма");
    }
  };

  const handleSaveMovie = async (data: ExtendedMovie) => {
    try {
      if (movies.find(m => m.id === data.id)) {
        await updateMovieApi(data.id, data);
        setMovies((p) => p.map((m) => (m.id === data.id ? data : m)));
        toast.success("Фильм обновлён");
      } else {
        const newMovie = await createMovieApi(data);
        setMovies((p) => [...p, { ...newMovie, id: String(newMovie.id) } as ExtendedMovie]);
        toast.success("Фильм добавлен");
      }
      setPanelMovie(null);
    } catch (e) {
      toast.error("Ошибка при сохранении фильма");
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 gap-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию или режиссёру…"
            className="bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-purple-500/50 w-72 text-white"
          />
        </div>
        <button
          onClick={() => setPanelMovie("new")}
          className="flex items-center gap-2 px-5 py-2 liquid-gradient rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25 shrink-0"
        >
          <Plus size={15} /> Добавить фильм
        </button>
      </div>

      {/* Table */}
      <div className="glass-strong rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr className="border-b border-white/8 bg-black/30">
                {["Фильм", "Жанры", "Длит.", "Рейтинг", "Выход", ""].map((h, i) => (
                  <th
                    key={i}
                    className={`px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      i === 5 ? "text-right w-24" : "text-left"
                    } ${i === 2 ? "w-20" : ""} ${i === 3 ? "w-20" : ""} ${i === 4 ? "w-28" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((movie) => (
                <tr key={movie.id} className="group hover:bg-white/[0.025] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-9 h-[52px] rounded-lg object-cover border border-white/10 shrink-0 bg-white/5"
                      />
                      <div>
                        <div className="font-semibold text-sm leading-tight">{movie.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{movie.director}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {movie.genre.slice(0, 2).map((g) => (
                        <span key={g} className="text-[10px] liquid-gradient-subtle text-purple-400 px-2 py-0.5 rounded">
                          {g}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-400 tabular-nums">{movie.duration} мин</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-yellow-400 fill-yellow-400 shrink-0" />
                      <span className="text-sm font-semibold">{movie.rating}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(movie.releaseDate).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setPanelMovie(movie)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                        title="Редактировать"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(movie.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                        title="Удалить"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-600 text-sm">
                    <Film size={36} className="mx-auto mb-3 opacity-20" />
                    Фильмы не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {panelMovie !== null && (
        <MoviePanel
          movie={panelMovie === "new" ? null : panelMovie}
          onClose={() => setPanelMovie(null)}
          onSave={handleSaveMovie}
        />
      )}
    </div>
  );
}

// ── Movie Side Panel ──────────────────────────────────────────────────────────

function MoviePanel({
  movie,
  onClose,
  onSave,
}: {
  movie: ExtendedMovie | null;
  onClose: () => void;
  onSave: (m: ExtendedMovie) => void;
}) {
  const isNew = !movie;
  const [form, setForm] = useState<any>({
    ...movie,
    genreStr: movie?.genre.join(", ") ?? "",
    castStr: movie?.cast.join(", ") ?? "",
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f: any) => ({ ...f, [key]: value }));

  const handleSave = () => {
    if (!form.title?.trim()) return toast.error("Введите название фильма");
    if (!form.posterUrl?.trim()) return toast.error("Введите URL постера");

    onSave({
      id: form.id ?? String(Date.now()),
      title: form.title.trim(),
      description: form.description?.trim() ?? "",
      rating: Number(form.rating) || 7.0,
      genre: (form.genreStr ?? "").split(",").map((s: string) => s.trim()).filter(Boolean),
      duration: Number(form.duration) || 90,
      releaseDate: form.releaseDate ?? TODAY,
      posterUrl: form.posterUrl!.trim(),
      bannerUrl: form.bannerUrl?.trim() || form.posterUrl!.trim(),
      trailerUrl: form.trailerUrl?.trim() ?? "",
      cast: (form.castStr ?? "").split(",").map((s: string) => s.trim()).filter(Boolean),
      director: form.director?.trim() ?? "",
    });
  };

  return (
    <SidePanel
      title={isNew ? "Новый фильм" : "Редактировать фильм"}
      icon={<Film size={17} className="text-purple-400" />}
      onClose={onClose}
    >
      <div className="space-y-4 pb-4">
        <Field label="Название *">
          <FInput
            value={form.title ?? ""}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Название фильма"
          />
        </Field>

        <Field label="Описание">
          <textarea
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500/50 transition-all text-white resize-none placeholder:text-gray-600"
            placeholder="Краткое описание сюжета…"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Длительность (мин)">
            <FInput
              type="number"
              value={form.duration ?? ""}
              onChange={(e) => set("duration", Number(e.target.value))}
              placeholder="120"
            />
          </Field>
          <Field label="Рейтинг (0–10)">
            <FInput
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={form.rating ?? ""}
              onChange={(e) => set("rating", Number(e.target.value))}
              placeholder="7.5"
            />
          </Field>
        </div>

        <Field label="Жанры (через запятую)">
          <FInput
            value={form.genreStr ?? ""}
            onChange={(e) => set("genreStr", e.target.value)}
            placeholder="Драма, Триллер, Фантастика"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Дата выхода">
            <FInput
              type="date"
              value={form.releaseDate ?? ""}
              onChange={(e) => set("releaseDate", e.target.value)}
            />
          </Field>
          <Field label="Режиссёр">
            <FInput
              value={form.director ?? ""}
              onChange={(e) => set("director", e.target.value)}
              placeholder="Имя режиссёра"
            />
          </Field>
        </div>

        <Field label="Актёры (через запятую)">
          <FInput
            value={form.castStr ?? ""}
            onChange={(e) => set("castStr", e.target.value)}
            placeholder="Актёр 1, Актёр 2, Актёр 3"
          />
        </Field>

        <Field label="URL постера *">
          <FInput
            value={form.posterUrl ?? ""}
            onChange={(e) => set("posterUrl", e.target.value)}
            placeholder="https://images.unsplash.com/ …"
          />
          {form.posterUrl && (
            <img
              src={form.posterUrl}
              alt="Постер"
              className="mt-2 h-32 w-auto rounded-xl border border-white/10 object-cover bg-white/5"
            />
          )}
        </Field>

        <Field label="URL баннера (широкое изображение)">
          <FInput
            value={form.bannerUrl ?? ""}
            onChange={(e) => set("bannerUrl", e.target.value)}
            placeholder="https://images.unsplash.com/ …"
          />
        </Field>

        <Field label="URL трейлера (YouTube)">
          <FInput
            value={form.trailerUrl ?? ""}
            onChange={(e) => set("trailerUrl", e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
          />
        </Field>

        <button
          onClick={handleSave}
          className="w-full py-3 liquid-gradient rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25"
        >
          <Save size={15} /> Сохранить фильм
        </button>
      </div>
    </SidePanel>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SESSIONS TAB
// ═══════════════════════════════════════════════════════════════════════════════

function SessionsTab({
  sessions,
  setSessions,
  movies,
  cinemas,
  hallsMap,
}: {
  sessions: ExtendedSession[];
  setSessions: React.Dispatch<React.SetStateAction<ExtendedSession[]>>;
  movies: ExtendedMovie[];
  cinemas: ExtendedCinema[];
  hallsMap: Record<string, { id: string; name: string }[]>;
}) {
  const [dateFilter, setDateFilter] = useState(TODAY);
  const [movieFilter, setMovieFilter] = useState("");
  const [cinemaFilter, setCinemaFilter] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ time: "", price: "" });
  const [bulkOpen, setBulkOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    return sessions
      .filter((s) => {
        if (dateFilter && s.date !== dateFilter) return false;
        if (movieFilter && s.movieId !== movieFilter) return false;
        if (cinemaFilter && s.cinemaId !== cinemaFilter) return false;
        if (search) {
          const m = movies.find((m) => m.id === s.movieId);
          const c = cinemas.find((c) => c.id === s.cinemaId);
          const q = search.toLowerCase();
          if (!m?.title.toLowerCase().includes(q) && !c?.name.toLowerCase().includes(q))
            return false;
        }
        return true;
      })
      .sort((a, b) => a.time.localeCompare(b.time))
      .slice(0, 150);
  }, [sessions, dateFilter, movieFilter, cinemaFilter, search, movies, cinemas]);

  const startEdit = (s: ExtendedSession) => {
    setEditingId(s.id);
    setEditData({ time: s.time, price: String(s.price) });
  };

  const saveEdit = async (id: string) => {
    try {
      await updateSessionApi(id, { time: editData.time, price: Number(editData.price) });
      setSessions((p) =>
        p.map((s) =>
          s.id === id
            ? { ...s, time: editData.time, price: Number(editData.price) || s.price }
            : s
        )
      );
      setEditingId(null);
      toast.success("Сеанс обновлён");
    } catch (e) {
      toast.error("Ошибка при обновлении сеанса");
    }
  };

  const duplicateSession = (s: ExtendedSession) => {
    setSessions((p) => [...p, { ...s, id: String(Date.now()) }]);
    toast.success("Сеанс продублирован");
  };

  const deleteSession = async (id: string) => {
    if(!window.confirm("Удалить этот сеанс?")) return;
    try {
      await deleteSessionApi(id);
      setSessions((p) => p.filter((s) => s.id !== id));
      toast.success("Сеанс удалён");
    } catch (e) {
      toast.error("Ошибка при удалении сеанса");
    }
  };

  const handleAddSession = async (newSession: ExtendedSession) => {
    try {
      const created = await createSessionApi(newSession);
      setSessions((p) => [...p, { ...created, id: String(created.id) } as ExtendedSession]);
      setAddOpen(false);
      toast.success("Сеанс добавлен");
    } catch (e) {
      toast.error("Ошибка при создании сеанса");
    }
  };

  const handleBulkSave = async (newSessions: ExtendedSession[]) => {
    try {
      for (const s of newSessions) {
        await createSessionApi(s);
      }
      setSessions((p) => [...p, ...newSessions]);
      setBulkOpen(false);
      toast.success(`Создано ${newSessions.length} сеансов`);
    } catch (e) {
      toast.error("Ошибка при массовом создании");
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 mb-5">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск…"
            className="bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-purple-500/50 w-44 text-white"
          />
        </div>

        {/* Date filter */}
        <div className="relative flex items-center">
          <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
          />
        </div>

        {/* Movie filter */}
        <div className="relative">
          <select
            value={movieFilter}
            onChange={(e) => setMovieFilter(e.target.value)}
            className="appearance-none bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white pr-8 focus:outline-none focus:border-purple-500/50 w-48"
          >
            <option value="">Все фильмы</option>
            {movies.map((m) => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>

        {/* Cinema filter */}
        <div className="relative">
          <select
            value={cinemaFilter}
            onChange={(e) => setCinemaFilter(e.target.value)}
            className="appearance-none bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white pr-8 focus:outline-none focus:border-purple-500/50 w-52"
          >
            <option value="">Все кинотеатры</option>
            {cinemas.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>

        <span className="text-xs text-gray-500 ml-auto">
          {filtered.length === 150 ? "150+ сеансов" : `${filtered.length} сеансов`}
        </span>

        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 glass rounded-xl text-sm hover:bg-white/10 transition-colors text-gray-300 border border-white/10"
        >
          <Plus size={14} /> Сеанс
        </button>

        <button
          onClick={() => setBulkOpen(true)}
          className="flex items-center gap-2 px-4 py-2 liquid-gradient rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25"
        >
          <Layers size={14} /> Массовое создание
        </button>
      </div>

      {/* Table */}
      <div className="glass-strong rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[740px]">
            <thead>
              <tr className="border-b border-white/8 bg-black/30">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Фильм</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Кинотеатр / Зал</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Дата</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Время</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Цена</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((session) => {
                const movie = movies.find((m) => m.id === session.movieId);
                const cinema = cinemas.find((c) => c.id === session.cinemaId);
                const isEditing = editingId === session.id;

                return (
                  <tr
                    key={session.id}
                    className={`group transition-colors ${
                      isEditing ? "bg-purple-500/5" : "hover:bg-white/[0.02]"
                    }`}
                  >
                    {/* Movie */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={movie?.posterUrl}
                          alt=""
                          className="w-8 h-11 rounded object-cover border border-white/10 shrink-0 bg-white/5"
                        />
                        <span className="text-xs font-medium truncate max-w-[140px]">
                          {movie?.title ?? "—"}
                        </span>
                      </div>
                    </td>

                    {/* Cinema / Hall */}
                    <td className="px-5 py-3">
                      <div className="text-xs font-medium truncate max-w-[160px]">{cinema?.name ?? "—"}</div>
                      <div className="text-[11px] text-gray-500">{session.hallName}</div>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {SHORT_DATE(session.date)}
                    </td>

                    {/* Time — inline editable */}
                    <td className="px-5 py-3">
                      {isEditing ? (
                        <input
                          type="time"
                          value={editData.time}
                          onChange={(e) => setEditData((d) => ({ ...d, time: e.target.value }))}
                          className="w-24 bg-black/60 border border-purple-500/50 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                        />
                      ) : (
                        <span className="font-mono font-semibold text-sm">{session.time}</span>
                      )}
                    </td>

                    {/* Price — inline editable */}
                    <td className="px-5 py-3">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editData.price}
                          onChange={(e) => setEditData((d) => ({ ...d, price: e.target.value }))}
                          className="w-24 bg-black/60 border border-purple-500/50 rounded-lg px-2 py-1 text-xs text-emerald-400 focus:outline-none"
                        />
                      ) : (
                        <span className="text-emerald-400 font-semibold text-xs">
                          {formatRub(session.price)}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdit(session.id)}
                              className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                              title="Сохранить"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 transition-colors"
                              title="Отмена"
                            >
                              <X size={13} />
                            </button>
                          </>
                        ) : (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEdit(session)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                              title="Редактировать"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => duplicateSession(session)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                              title="Дублировать"
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              onClick={() => deleteSession(session.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                              title="Удалить"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-600 text-sm">
                    <Clock size={36} className="mx-auto mb-3 opacity-20" />
                    Нет сеансов по выбранным фильтрам
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk create panel */}
      {bulkOpen && (
        <BulkSessionPanel
          movies={movies}
          cinemas={cinemas}
          hallsMap={hallsMap}
          onClose={() => setBulkOpen(false)}
          onSave={handleBulkSave}
        />
      )}

      {/* Add single session panel */}
      {addOpen && (
        <AddSessionPanel
          movies={movies}
          cinemas={cinemas}
          hallsMap={hallsMap}
          onClose={() => setAddOpen(false)}
          onSave={handleAddSession}
        />
      )}
    </div>
  );
}

// ── Bulk Session Panel ────────────────────────────────────────────────────────

function BulkSessionPanel({
  movies,
  cinemas,
  hallsMap,
  onClose,
  onSave,
}: {
  movies: ExtendedMovie[];
  cinemas: ExtendedCinema[];
  hallsMap: Record<string, { id: string; name: string }[]>;
  onClose: () => void;
  onSave: (sessions: ExtendedSession[]) => void;
}) {
  const [movieId, setMovieId] = useState(movies[0]?.id ?? "");
  const [cinemaId, setCinemaId] = useState(cinemas[0]?.id ?? "");
  const [hallId, setHallId] = useState("");
  const [hallName, setHallName] = useState("");
  const [date, setDate] = useState(TODAY);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("22:00");
  const [intervalMin, setIntervalMin] = useState("180");
  const [price, setPrice] = useState("499");
  const [preview, setPreview] = useState<ExtendedSession[]>([]);

  const currentHalls = hallsMap[cinemaId] ?? [];
  const isCustomHall = hallId === "custom";
  const selectedMovie = movies.find((m) => m.id === movieId);
  const selectedCinema = cinemas.find((c) => c.id === cinemaId);

  useEffect(() => {
    const h = (hallsMap[cinemaId] ?? [])[0];
    setHallId(h?.id ?? "custom");
    setHallName(h?.name ?? "");
    setPreview([]);
  }, [cinemaId, hallsMap]);

  const resetPreview = () => setPreview([]);

  const generate = () => {
    const iv = parseInt(intervalMin);
    const finalHallName = isCustomHall
      ? hallName
      : currentHalls.find((h) => h.id === hallId)?.name ?? "";

    if (!movieId || !cinemaId || !date) return toast.error("Заполните все поля");
    if (!finalHallName.trim()) return toast.error("Укажите название зала");
    if (isNaN(iv) || iv < 30) return toast.error("Интервал должен быть не менее 30 минут");

    const hallIdFinal = isCustomHall ? `h_${Date.now()}` : hallId;
    const generated: ExtendedSession[] = [];
    let cur = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    while (cur <= end) {
      generated.push({
        id: String(Date.now() + generated.length),
        movieId,
        cinemaId,
        hallId: hallIdFinal,
        hallName: finalHallName,
        date,
        time: cur.toTimeString().substring(0, 5),
        price: snapPrice(parseInt(price) || 499),
        integrationLevel: selectedCinema?.integrationLevel ?? 1,
      });
      cur = new Date(cur.getTime() + iv * 60000);
    }

    if (generated.length === 0) return toast.error("Нет сеансов в заданном диапазоне");
    setPreview(generated);
  };

  const snapped = snapPrice(parseInt(price) || 0);

  return (
    <SidePanel
      title="Массовое создание сеансов"
      icon={<Layers size={17} className="text-purple-400" />}
      onClose={onClose}
      wide
    >
      <div className="space-y-4 pb-4">
        {/* Movie */}
        <Field label="Фильм">
          <FSelect value={movieId} onChange={(v) => { setMovieId(v); resetPreview(); }}>
            {movies.map((m) => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </FSelect>
        </Field>

        {selectedMovie && (
          <div className="flex items-center gap-3 p-3 glass rounded-xl border border-white/8">
            <img src={selectedMovie.posterUrl} alt="" className="w-9 h-12 rounded object-cover shrink-0 bg-white/5" />
            <div>
              <div className="text-sm font-semibold">{selectedMovie.title}</div>
              <div className="text-xs text-gray-400">
                {selectedMovie.duration} мин · {selectedMovie.genre.slice(0, 2).join(", ")}
              </div>
            </div>
          </div>
        )}

        {/* Cinema & Hall */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Кинотеатр">
            <FSelect value={cinemaId} onChange={(v) => { setCinemaId(v); resetPreview(); }}>
              {cinemas.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </FSelect>
          </Field>
          <Field label="Зал">
            <FSelect
              value={hallId}
              onChange={(v) => {
                setHallId(v);
                if (v !== "custom") {
                  setHallName(currentHalls.find((h) => h.id === v)?.name ?? "");
                } else {
                  setHallName("");
                }
                resetPreview();
              }}
            >
              {currentHalls.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
              <option value="custom">+ Новый зал</option>
            </FSelect>
          </Field>
        </div>

        {isCustomHall && (
          <Field label="Название нового зала">
            <FInput
              value={hallName}
              onChange={(e) => { setHallName(e.target.value); resetPreview(); }}
              placeholder="Зал 1, IMAX, Premium…"
            />
          </Field>
        )}

        {/* Date */}
        <Field label="Дата проведения">
          <FInput
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); resetPreview(); }}
          />
        </Field>

        {/* Time range + interval */}
        <div className="grid grid-cols-3 gap-3">
          <Field label="Начало">
            <FInput type="time" value={startTime} onChange={(e) => { setStartTime(e.target.value); resetPreview(); }} />
          </Field>
          <Field label="Конец">
            <FInput type="time" value={endTime} onChange={(e) => { setEndTime(e.target.value); resetPreview(); }} />
          </Field>
          <Field label="Интервал (мин)">
            <FInput
              type="number"
              value={intervalMin}
              onChange={(e) => { setIntervalMin(e.target.value); resetPreview(); }}
              placeholder="180"
            />
          </Field>
        </div>

        {/* Price */}
        <Field label="Цена (₽)">
          <FInput
            type="number"
            value={price}
            onChange={(e) => { setPrice(e.target.value); resetPreview(); }}
            placeholder="499"
          />
          {price && parseInt(price) > 0 && (
            <div className="text-[11px] text-gray-500 mt-1">
              Округление до: <span className="text-purple-400 font-semibold">{formatRub(snapped)}</span>
            </div>
          )}
        </Field>

        {/* Generate button */}
        <button
          onClick={generate}
          className="w-full py-2.5 border border-purple-500/40 text-purple-300 rounded-xl text-sm font-medium hover:bg-purple-500/10 transition-colors flex items-center justify-center gap-2"
        >
          <Clock size={14} /> Сгенерировать расписание
        </button>

        {/* Preview */}
        {preview.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Предпросмотр</span>
              <span className="bg-white/10 px-2.5 py-0.5 rounded-full text-xs font-medium">
                {preview.length} сеансов
              </span>
            </div>
            <div className="glass rounded-xl p-3 max-h-52 overflow-y-auto custom-scrollbar space-y-1">
              {preview.map((s, i) => (
                <div key={i} className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-white/5 text-sm">
                  <span className="font-mono text-xs font-semibold text-white/80">{s.time}</span>
                  <span className="text-emerald-400 text-xs font-semibold">{formatRub(s.price)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save */}
        <button
          onClick={() => {
            if (!preview.length) return toast.error("Сначала сгенерируйте расписание");
            onSave(preview);
          }}
          disabled={preview.length === 0}
          className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
            preview.length
              ? "liquid-gradient hover:opacity-90 shadow-lg shadow-purple-500/25"
              : "bg-white/5 text-gray-600 cursor-not-allowed"
          }`}
        >
          <Save size={14} />
          {preview.length ? `Создать ${preview.length} сеансов` : "Создать сеансы"}
        </button>
      </div>
    </SidePanel>
  );
}

// ── Add Single Session Panel ──────────────────────────────────────────────────

function AddSessionPanel({
  movies,
  cinemas,
  hallsMap,
  onClose,
  onSave,
}: {
  movies: ExtendedMovie[];
  cinemas: ExtendedCinema[];
  hallsMap: Record<string, { id: string; name: string }[]>;
  onClose: () => void;
  onSave: (session: ExtendedSession) => void;
}) {
  const [movieId, setMovieId] = useState(movies[0]?.id ?? "");
  const [cinemaId, setCinemaId] = useState(cinemas[0]?.id ?? "");
  const [hallId, setHallId] = useState("");
  const [customHallName, setCustomHallName] = useState("");
  const [date, setDate] = useState(TODAY);
  const [time, setTime] = useState("12:00");
  const [price, setPrice] = useState("499");

  const halls = hallsMap[cinemaId] ?? [];
  const isCustom = hallId === "custom";

  useEffect(() => {
    const h = (hallsMap[cinemaId] ?? [])[0];
    setHallId(h?.id ?? "custom");
  }, [cinemaId, hallsMap]);

  const handleSave = () => {
    const cinema = cinemas.find((c) => c.id === cinemaId);
    const hall = halls.find((h) => h.id === hallId);
    const finalHallName = isCustom ? customHallName.trim() : (hall?.name ?? "Зал");
    if (!movieId || !cinemaId || !date || !time) return toast.error("Заполните все поля");
    if (!finalHallName) return toast.error("Укажите название зала");

    onSave({
      id: String(Date.now()),
      movieId,
      cinemaId,
      hallId: isCustom ? `h_${Date.now()}` : hallId,
      hallName: finalHallName,
      date,
      time,
      price: snapPrice(parseInt(price) || 499),
      integrationLevel: cinema?.integrationLevel ?? 1,
    });
  };

  return (
    <SidePanel
      title="Новый сеанс"
      icon={<Clock size={17} className="text-purple-400" />}
      onClose={onClose}
    >
      <div className="space-y-4 pb-4">
        <Field label="Фильм">
          <FSelect value={movieId} onChange={setMovieId}>
            {movies.map((m) => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </FSelect>
        </Field>

        <Field label="Кинотеатр">
          <FSelect value={cinemaId} onChange={setCinemaId}>
            {cinemas.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </FSelect>
        </Field>

        <Field label="Зал">
          <FSelect value={hallId} onChange={setHallId}>
            {halls.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
            <option value="custom">+ Новый зал</option>
          </FSelect>
        </Field>

        {isCustom && (
          <Field label="Название зала">
            <FInput
              value={customHallName}
              onChange={(e) => setCustomHallName(e.target.value)}
              placeholder="Зал 1"
            />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Дата">
            <FInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Время">
            <FInput type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
        </div>

        <Field label="Цена (₽)">
          <FInput
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="499"
          />
        </Field>

        <button
          onClick={handleSave}
          className="w-full py-3 liquid-gradient rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 shadow-lg shadow-purple-500/25"
        >
          <Save size={14} /> Добавить сеанс
        </button>
      </div>
    </SidePanel>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CINEMAS TAB
// ═══════════════════════════════════════════════════════════════════════════════

function CinemasTab({
  cinemas,
  setCinemas,
  hallsMap,
}: {
  cinemas: ExtendedCinema[];
  setCinemas: React.Dispatch<React.SetStateAction<ExtendedCinema[]>>;
  hallsMap: Record<string, { id: string; name: string }[]>;
}) {
  const [search, setSearch] = useState("");
  const [panelCinema, setPanelCinema] = useState<ExtendedCinema | "new" | null>(null);

  const filtered = useMemo(
    () =>
      cinemas.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.city.toLowerCase().includes(search.toLowerCase())
      ),
    [cinemas, search]
  );

  const handleDelete = async (id: string) => {
    if (!window.confirm("Удалить кинотеатр?")) return;
    try {
      await deleteCinemaApi(id);
      setCinemas((p) => p.filter((c) => c.id !== id));
      toast.success("Кинотеатр удалён");
    } catch (e) {
      toast.error("Ошибка при удалении кинотеатра");
    }
  };

  const handleSaveCinema = async (data: ExtendedCinema) => {
    try {
      if (cinemas.find(c => c.id === data.id)) {
        await updateCinemaApi(data.id, data);
        setCinemas((p) => p.map((c) => (c.id === data.id ? data : c)));
        toast.success("Кинотеатр обновлён");
      } else {
        const newCinema = await createCinemaApi(data);
        setCinemas((p) => [...p, { ...newCinema, id: String(newCinema.id) } as ExtendedCinema]);
        toast.success("Кинотеатр добавлен");
      }
      setPanelCinema(null);
    } catch (e) {
      toast.error("Ошибка при сохранении кинотеатра");
    }
  };

  const LEVEL: Record<number, { label: string; color: string }> = {
    1: { label: "Выбор мест", color: "text-emerald-400" },
    2: { label: "Общий вход", color: "text-yellow-400" },
    3: { label: "По телефону", color: "text-orange-400" },
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 gap-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск кинотеатра или города…"
            className="bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-purple-500/50 w-72 text-white"
          />
        </div>
        <button
          onClick={() => setPanelCinema("new")}
          className="flex items-center gap-2 px-5 py-2 liquid-gradient rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25 shrink-0"
        >
          <Plus size={15} /> Добавить кинотеатр
        </button>
      </div>

      {/* Cinema cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((cinema) => {
          const halls = hallsMap[cinema.id] ?? [];
          const level = LEVEL[cinema.integrationLevel] ?? LEVEL[1];

          return (
            <div
              key={cinema.id}
              className="glass-strong rounded-2xl p-5 border border-white/8 hover:border-purple-500/20 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="min-w-0 pr-4 flex-1">
                  <div className="font-bold text-base leading-tight">{cinema.name}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                    <MapPin size={11} className="shrink-0" />
                    <span className="truncate">{cinema.city} · {cinema.address}</span>
                  </div>
                  <div className={`text-xs mt-2 font-medium ${level.color}`}>
                    ● {level.label}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setPanelCinema(cinema)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                    title="Редактировать"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(cinema.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                    title="Удалить"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Halls */}
              <div>
                <div className="text-[10px] text-gray-500 mb-2 uppercase tracking-wider">
                  Залы ({halls.length > 0 ? halls.length : cinema.totalHalls})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {halls.length > 0 ? (
                    <>
                      {halls.slice(0, 5).map((h) => (
                        <span
                          key={h.id}
                          className="text-[11px] bg-white/5 border border-white/8 px-2.5 py-1 rounded-lg text-gray-300"
                        >
                          {h.name}
                        </span>
                      ))}
                      {halls.length > 5 && (
                        <span className="text-[11px] bg-white/5 border border-white/8 px-2.5 py-1 rounded-lg text-gray-500">
                          +{halls.length - 5}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-gray-600">{cinema.totalHalls} залов</span>
                  )}
                </div>
              </div>

              {/* Facilities */}
              {cinema.facilities.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-white/5">
                  {cinema.facilities.slice(0, 5).map((f) => (
                    <span key={f} className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-500">
                      {f}
                    </span>
                  ))}
                  {cinema.facilities.length > 5 && (
                    <span className="text-[10px] text-gray-600">+{cinema.facilities.length - 5}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-2 py-16 text-center text-gray-600 text-sm glass-strong rounded-2xl">
            <Building2 size={36} className="mx-auto mb-3 opacity-20" />
            Кинотеатры не найдены
          </div>
        )}
      </div>

      {panelCinema !== null && (
        <CinemaPanel
          cinema={panelCinema === "new" ? null : panelCinema}
          onClose={() => setPanelCinema(null)}
          onSave={handleSaveCinema}
        />
      )}
    </div>
  );
}

// ── Cinema Side Panel ─────────────────────────────────────────────────────────

function CinemaPanel({
  cinema,
  onClose,
  onSave,
}: {
  cinema: ExtendedCinema | null;
  onClose: () => void;
  onSave: (c: ExtendedCinema) => void;
}) {
  const isNew = !cinema;
  const [form, setForm] = useState<any>({
    ...cinema,
    facilitiesStr: cinema?.facilities.join(", ") ?? "",
    tagsStr: cinema?.infrastructureTags?.join(", ") ?? "",
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f: any) => ({ ...f, [key]: value }));

  const handleSave = () => {
    if (!form.name?.trim()) return toast.error("Введите название кинотеатра");
    if (!form.city?.trim()) return toast.error("Введите город");

    onSave({
      id: form.id ?? String(Date.now()),
      name: form.name.trim(),
      address: form.address?.trim() ?? "",
      city: form.city.trim(),
      rating: Number(form.rating) || 4.5,
      distance: form.distance,
      latitude: Number(form.latitude) || 55.75,
      longitude: Number(form.longitude) || 37.62,
      facilities: (form.facilitiesStr ?? "").split(",").map((s: string) => s.trim()).filter(Boolean),
      totalHalls: Number(form.totalHalls) || 1,
      imageUrl:
        form.imageUrl?.trim() ||
        "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=400&fit=crop",
      integrationLevel: (Number(form.integrationLevel) || 1) as 1 | 2 | 3,
      phoneNumber: form.phoneNumber?.trim(),
      infrastructureTags: (form.tagsStr ?? "").split(",").map((s: string) => s.trim()).filter(Boolean),
    });
  };

  const intLevel = Number(form.integrationLevel) || 1;

  return (
    <SidePanel
      title={isNew ? "Новый кинотеатр" : "Редактировать кинотеатр"}
      icon={<Building2 size={17} className="text-cyan-400" />}
      onClose={onClose}
    >
      <div className="space-y-4 pb-4">
        <Field label="Название *">
          <FInput
            value={form.name ?? ""}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Название кинотеатра"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Город *">
            <FSelect value={form.city ?? "Москва"} onChange={(v) => set("city", v)}>
              <option value="Москва">Москва</option>
              <option value="Саратов">Саратов</option>
              <option value="Аткарск">Аткарск</option>
            </FSelect>
          </Field>
          <Field label="Уровень интеграции">
            <FSelect
              value={String(form.integrationLevel ?? 1)}
              onChange={(v) => set("integrationLevel", parseInt(v) as 1 | 2 | 3)}
            >
              <option value="1">1 — Выбор мест</option>
              <option value="2">2 — Общий вход</option>
              <option value="3">3 — По телефону</option>
            </FSelect>
          </Field>
        </div>

        {/* Integration level hint */}
        <div className={`text-xs px-3 py-2 rounded-lg border ${
          intLevel === 1 ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" :
          intLevel === 2 ? "border-yellow-500/20 bg-yellow-500/5 text-yellow-400" :
          "border-orange-500/20 bg-orange-500/5 text-orange-400"
        }`}>
          {intLevel === 1 && "Полный выбор мест с интерактивной схемой зала"}
          {intLevel === 2 && "Бронирование без выбора конкретного места"}
          {intLevel === 3 && "Бронирование только по звонку — укажите телефон"}
        </div>

        <Field label="Адрес">
          <FInput
            value={form.address ?? ""}
            onChange={(e) => set("address", e.target.value)}
            placeholder="Улица, дом"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Рейтинг (1–5)">
            <FInput
              type="number"
              step="0.1"
              min="1"
              max="5"
              value={form.rating ?? ""}
              onChange={(e) => set("rating", Number(e.target.value))}
              placeholder="4.5"
            />
          </Field>
          <Field label="Количество залов">
            <FInput
              type="number"
              min="1"
              value={form.totalHalls ?? ""}
              onChange={(e) => set("totalHalls", Number(e.target.value))}
              placeholder="10"
            />
          </Field>
        </div>

        {intLevel === 3 && (
          <Field label="Телефон для бронирования *">
            <FInput
              value={form.phoneNumber ?? ""}
              onChange={(e) => set("phoneNumber", e.target.value)}
              placeholder="+7 (000) 000-00-00"
            />
          </Field>
        )}

        <Field label="Удобства (через запятую)">
          <FInput
            value={form.facilitiesStr ?? ""}
            onChange={(e) => set("facilitiesStr", e.target.value)}
            placeholder="IMAX, 4DX, Парковка, VIP"
          />
        </Field>

        <Field label="Инфраструктурные теги">
          <FInput
            value={form.tagsStr ?? ""}
            onChange={(e) => set("tagsStr", e.target.value)}
            placeholder="Карта, Apple Pay, Снеки, Бесплатный Wi-Fi"
          />
        </Field>

        <Field label="URL изображения">
          <FInput
            value={form.imageUrl ?? ""}
            onChange={(e) => set("imageUrl", e.target.value)}
            placeholder=" https://images.unsplash.com/ …"
          />
          {form.imageUrl && (
            <img
              src={form.imageUrl}
              alt="preview"
              className="mt-2 h-28 w-full rounded-xl object-cover border border-white/10 bg-white/5"
            />
          )}
        </Field>

        <button
          onClick={handleSave}
          className="w-full py-3 liquid-gradient rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 shadow-lg shadow-purple-500/25"
        >
          <Save size={14} /> Сохранить кинотеатр
        </button>
      </div>
    </SidePanel>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════════

function SidePanel({
  title,
  icon,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative h-full glass-strong border-l border-white/10 shadow-[-30px_0_80px_rgba(0,0,0,0.9)] flex flex-col animate-in slide-in-from-right duration-300 ${
          wide ? "w-[520px]" : "w-[460px]"
        }`}
      >
        {/* Panel header */}
        <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between shrink-0 bg-black/40">
          <h2 className="font-semibold text-base flex items-center gap-2">
            {icon}
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
          >
            <X size={17} />
          </button>
        </div>
        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

function FInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500/50 transition-all text-white placeholder:text-gray-600 ${
        props.className ?? ""
      }`}
    />
  );
}

function FSelect({
  value,
  onChange,
  children,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className ?? ""}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500/50 transition-all text-white pr-9 cursor-pointer"
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
      />
    </div>
  );
}