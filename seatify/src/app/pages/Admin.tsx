import { useState, useMemo, useEffect } from "react";
import { Navigate } from "react-router";
import {
  Plus, Edit2, Trash2, Film, Clock, ChevronDown, Save,
  Layers, Search, Building2, Ticket, Copy, Check, X,
  MapPin, Star, Calendar, Loader2
} from "lucide-react";
import { formatRub } from "../utils/formatRub";
import { toast } from "sonner";
// ✅ Импортируем РЕАЛЬНЫЕ API функции вместо заглушек
import { 
  fetchMovies, 
  fetchSessionsByMovie, 
  createMovie, 
  updateMovie, 
  deleteMovie,
  createSession,
  updateSession,
  deleteSession,
  createCinema,
  updateCinema,
  deleteCinema,
  type Movie as ApiMovie, 
  type Session as ApiSession 
} from "../services/api";
import { useAuth } from "../contexts/AuthContext";

// ─── Constants & Helpers ──────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split("T")[0];

const SHORT_DATE = (d: string) =>
  new Date(d + "T00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

const PRICE_STEPS = [99,149,199,249,299,349,399,449,499,549,599,649,699,749,799,849,899,949,999,1099,1199,1299,1399,1499];
const snapPrice = (n: number) =>
  PRICE_STEPS.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a));

// ─── Extended Types for Frontend (snake_case как в backend) ──────────────────

interface ExtendedMovie extends ApiMovie {
  genre: string[];
  rating: number;
  cast: string[];
  director: string;
}

interface ExtendedSession extends ApiSession {
  date: string;
  time: string;
  price: number;
}

interface ExtendedCinema {
  id: number;
  name: string;
  address: string;
  city: string;
  rating: number;
  facilities: string[];
  totalHalls: number;
}

// ❌ УДАЛЕНЫ ВСЕ ЗАГЛУШКИ API (createMovieApi, updateMovieApi и т.д.)

// ─── Root Component ───────────────────────────────────────────────────────────

type Tab = "movies" | "sessions" | "cinemas";

export default function Admin() {
  const { user, isAdmin, isLoading } = useAuth();
  
  const [tab, setTab] = useState<Tab>("movies");
  
  const [moviesList, setMoviesList] = useState<ExtendedMovie[]>([]);
  const [cinemasList, setCinemasList] = useState<ExtendedCinema[]>([]);
  const [sessionsList, setSessionsList] = useState<ExtendedSession[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  if (!isLoading && (!user || !isAdmin())) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    if (!user || !isAdmin()) return;

    const loadData = async () => {
      setDataLoading(true);
      try {
        // 1. Load Movies
        const apiMovies = await fetchMovies();
        const extendedMovies: ExtendedMovie[] = apiMovies.map(m => ({
          ...m,
          genre: m.genre || ["Фантастика", "Боевик"],
          rating: m.rating || 7.5,
          cast: m.cast || ["Актер 1", "Актер 2"],
          director: m.director || "Режиссер",
        }));
        setMoviesList(extendedMovies);

        // 2. Load Sessions for all movies
        const allSessionsPromises = apiMovies.map(m => fetchSessionsByMovie(m.id));
        const sessionsArrays = await Promise.all(allSessionsPromises);
        
        const flatSessions: ExtendedSession[] = sessionsArrays.flat().map(s => ({
          ...s,
          date: new Date(s.start_time).toISOString().split('T')[0],
          time: new Date(s.start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          price: s.base_price_cents / 100,
        }));
        setSessionsList(flatSessions);

        // 3. Extract Cinemas from Sessions
        const cinemaMap = new Map<number, ExtendedCinema>();
        flatSessions.forEach(s => {
          if (!cinemaMap.has(s.cinema_id)) {
            cinemaMap.set(s.cinema_id, {
              id: s.cinema_id,
              name: `Кинотеатр ${s.cinema_id}`,
              address: s.cinema_address || "Адрес уточняется",
              city: s.cinema_city || "Москва",
              rating: 4.5,
              facilities: ["Wi-Fi"],
              totalHalls: 1,
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
  }, [user]);

  const hallsMap = useMemo(() => {
    const map: Record<number, { id: number; name: string }[]> = {};
    sessionsList.forEach((s) => {
      if (!map[s.cinema_id]) map[s.cinema_id] = [];
      if (!map[s.cinema_id].find((h) => h.id === s.hall_id)) {
        map[s.cinema_id].push({ id: s.hall_id, name: `Зал ${s.hall_id}` });
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

  const handleDelete = async (id: number) => {
    const count = sessions.filter((s) => s.movie_id === id).length;
    const msg = count
      ? `С фильмом связано ${count} сеансов. Удалить фильм и все его сеансы?`
      : "Удалить фильм?";
    if (!window.confirm(msg)) return;
    
    try {
      await deleteMovie(id);
      setMovies((p) => p.filter((m) => m.id !== id));
      if (count) setSessions((p) => p.filter((s) => s.movie_id !== id));
      toast.success("Фильм удалён");
    } catch (e) {
      toast.error("Ошибка при удалении фильма");
    }
  };

  const handleSaveMovie = async (data: ExtendedMovie) => {
    try {
      if (data.id) {
        await updateMovie(data.id, data);
        setMovies((p) => p.map((m) => (m.id === data.id ? data : m)));
        toast.success("Фильм обновлён");
      } else {
        const newMovie = await createMovie(data);
        setMovies((p) => [...p, newMovie]);
        toast.success("Фильм добавлен");
      }
      setPanelMovie(null);
    } catch (e: any) {
      toast.error(`Ошибка при сохранении фильма: ${e.message}`);
    }
  };

  return (
    <div>
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
                        src={movie.poster_url}
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
                  <td className="px-5 py-3 text-sm text-gray-400 tabular-nums">{movie.duration_minutes} мин</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-yellow-400 fill-yellow-400 shrink-0" />
                      <span className="text-sm font-semibold">{movie.rating}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(movie.release_date).toLocaleDateString("ru-RU", {
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
    if (!form.poster_url?.trim()) return toast.error("Введите URL постера");

    onSave({
      id: form.id,
      title: form.title.trim(),
      description: form.description?.trim() ?? "",
      rating: Number(form.rating) || 7.0,
      genre: (form.genreStr ?? "").split(",").map((s: string) => s.trim()).filter(Boolean),
      duration_minutes: Number(form.duration_minutes) || 90,
      release_date: form.release_date ?? TODAY,
      poster_url: form.poster_url!.trim(),
      banner_url: form.banner_url?.trim() || form.poster_url!.trim(),
      trailer_url: form.trailer_url?.trim() ?? "",
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
              value={form.duration_minutes ?? ""}
              onChange={(e) => set("duration_minutes", Number(e.target.value))}
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
              value={form.release_date ?? ""}
              onChange={(e) => set("release_date", e.target.value)}
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
            value={form.poster_url ?? ""}
            onChange={(e) => set("poster_url", e.target.value)}
            placeholder="https://images.unsplash.com/ …"
          />
          {form.poster_url && (
            <img
              src={form.poster_url}
              alt="Постер"
              className="mt-2 h-32 w-auto rounded-xl border border-white/10 object-cover bg-white/5"
            />
          )}
        </Field>

        <Field label="URL баннера (широкое изображение)">
          <FInput
            value={form.banner_url ?? ""}
            onChange={(e) => set("banner_url", e.target.value)}
            placeholder="https://images.unsplash.com/ …"
          />
        </Field>

        <Field label="URL трейлера (YouTube)">
          <FInput
            value={form.trailer_url ?? ""}
            onChange={(e) => set("trailer_url", e.target.value)}
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
  hallsMap: Record<number, { id: number; name: string }[]>;
}) {
  const [dateFilter, setDateFilter] = useState(TODAY);
  const [movieFilter, setMovieFilter] = useState("");
  const [cinemaFilter, setCinemaFilter] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState({ time: "", price: "" });
  const [bulkOpen, setBulkOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const filtered = useMemo(() => {
    return sessions
      .filter((s) => {
        if (dateFilter && s.date !== dateFilter) return false;
        if (movieFilter && s.movie_id !== Number(movieFilter)) return false;
        if (cinemaFilter && s.cinema_id !== Number(cinemaFilter)) return false;
        if (search) {
          const m = movies.find((m) => m.id === s.movie_id);
          const c = cinemas.find((c) => c.id === s.cinema_id);
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

  const saveEdit = async (id: number) => {
    try {
      const session = sessions.find(s => s.id === id);
      if (!session) return;

      // Формируем start_time из date и нового time
      const startTime = `${session.date}T${editData.time}:00Z`;
      
      await updateSession(id, { 
        start_time: startTime,
        base_price_cents: Math.round(Number(editData.price) * 100)
      });
      
      setSessions((p) =>
        p.map((s) =>
          s.id === id
            ? { 
                ...s, 
                time: editData.time, 
                price: Number(editData.price) || s.price,
                start_time: startTime,
                base_price_cents: Math.round(Number(editData.price) * 100)
              }
            : s
        )
      );
      setEditingId(null);
      toast.success("Сеанс обновлён");
    } catch (e) {
      toast.error("Ошибка при обновлении сеанса");
    }
  };

  const duplicateSession = async (s: ExtendedSession) => {
    try {
      const { id, ...sessionData } = s;
      const created = await createSession(sessionData);
      setSessions((p) => [...p, { 
        ...created, 
        date: new Date(created.start_time).toISOString().split('T')[0],
        time: new Date(created.start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        price: created.base_price_cents / 100
      }]);
      toast.success("Сеанс продублирован");
    } catch (e) {
      toast.error("Ошибка при дублировании сеанса");
    }
  };

  const handleDeleteSession = async (id: number) => {
    if(!window.confirm("Удалить этот сеанс?")) return;
    try {
      await deleteSession(id);
      setSessions((p) => p.filter((s) => s.id !== id));
      toast.success("Сеанс удалён");
    } catch (e) {
      toast.error("Ошибка при удалении сеанса");
    }
  };

  const handleAddSession = async (newSession: ExtendedSession) => {
    try {
      const { date, time, price, ...sessionData } = newSession;
      const created = await createSession({
        ...sessionData,
        start_time: `${date}T${time}:00Z`,
        base_price_cents: Math.round(price * 100)
      });
      
      setSessions((p) => [...p, { 
        ...created,
        date: new Date(created.start_time).toISOString().split('T')[0],
        time: new Date(created.start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        price: created.base_price_cents / 100
      }]);
      setAddOpen(false);
      toast.success("Сеанс добавлен");
    } catch (e: any) {
      toast.error(`Ошибка при создании сеанса: ${e.message}`);
    }
  };

  const handleBulkSave = async (newSessions: ExtendedSession[]) => {
    try {
      const createdSessions: ExtendedSession[] = [];
      for (const s of newSessions) {
        const { date, time, price, ...sessionData } = s;
        const created = await createSession({
          ...sessionData,
          start_time: `${date}T${time}:00Z`,
          base_price_cents: Math.round(price * 100)
        });
        createdSessions.push({
          ...created,
          date: new Date(created.start_time).toISOString().split('T')[0],
          time: new Date(created.start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          price: created.base_price_cents / 100
        });
      }
      setSessions((p) => [...p, ...createdSessions]);
      setBulkOpen(false);
      toast.success(`Создано ${createdSessions.length} сеансов`);
    } catch (e: any) {
      toast.error(`Ошибка при массовом создании: ${e.message}`);
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
                const movie = movies.find((m) => m.id === session.movie_id);
                const cinema = cinemas.find((c) => c.id === session.cinema_id);
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
                          src={movie?.poster_url}
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
                      <div className="text-[11px] text-gray-500">Зал {session.hall_id}</div>
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
                              onClick={() => handleDeleteSession(session.id)}
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
  hallsMap: Record<number, { id: number; name: string }[]>;
  onClose: () => void;
  onSave: (sessions: ExtendedSession[]) => void;
}) {
  const [movieId, setMovieId] = useState(movies[0]?.id ?? 0);
  const [cinemaId, setCinemaId] = useState(cinemas[0]?.id ?? 0);
  const [hallId, setHallId] = useState(0);
  const [date, setDate] = useState(TODAY);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("22:00");
  const [intervalMin, setIntervalMin] = useState("180");
  const [price, setPrice] = useState("499");
  const [preview, setPreview] = useState<ExtendedSession[]>([]);

  const currentHalls = hallsMap[cinemaId] ?? [];
  const selectedMovie = movies.find((m) => m.id === movieId);
  const selectedCinema = cinemas.find((c) => c.id === cinemaId);

  useEffect(() => {
    const h = (hallsMap[cinemaId] ?? [])[0];
    setHallId(h?.id ?? 0);
    setPreview([]);
  }, [cinemaId, hallsMap]);

  const resetPreview = () => setPreview([]);

  const generate = () => {
    const iv = parseInt(intervalMin);
    
    if (!movieId || !cinemaId || !hallId || !date) return toast.error("Заполните все поля");
    if (isNaN(iv) || iv < 30) return toast.error("Интервал должен быть не менее 30 минут");

    const generated: ExtendedSession[] = [];
    let cur = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    while (cur <= end) {
      const timeStr = cur.toTimeString().substring(0, 5);
      generated.push({
        id: 0, // Временный ID для preview
        movie_id: movieId,
        cinema_id: cinemaId,
        hall_id: hallId,
        start_time: `${date}T${timeStr}:00Z`,
        base_price_cents: Math.round(snapPrice(parseInt(price) || 499) * 100),
        date,
        time: timeStr,
        price: snapPrice(parseInt(price) || 499),
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
          <FSelect value={String(movieId)} onChange={(v) => { setMovieId(Number(v)); resetPreview(); }}>
            {movies.map((m) => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </FSelect>
        </Field>

        {selectedMovie && (
          <div className="flex items-center gap-3 p-3 glass rounded-xl border border-white/8">
            <img src={selectedMovie.poster_url} alt="" className="w-9 h-12 rounded object-cover shrink-0 bg-white/5" />
            <div>
              <div className="text-sm font-semibold">{selectedMovie.title}</div>
              <div className="text-xs text-gray-400">
                {selectedMovie.duration_minutes} мин · {selectedMovie.genre?.slice(0, 2).join(", ")}
              </div>
            </div>
          </div>
        )}

        {/* Cinema & Hall */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Кинотеатр">
            <FSelect value={String(cinemaId)} onChange={(v) => { setCinemaId(Number(v)); resetPreview(); }}>
              {cinemas.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </FSelect>
          </Field>
          <Field label="Зал">
            <FSelect
              value={String(hallId)}
              onChange={(v) => {
                setHallId(Number(v));
                resetPreview();
              }}
            >
              {currentHalls.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </FSelect>
          </Field>
        </div>

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
  hallsMap: Record<number, { id: number; name: string }[]>;
  onClose: () => void;
  onSave: (session: ExtendedSession) => void;
}) {
  const [movieId, setMovieId] = useState(movies[0]?.id ?? 0);
  const [cinemaId, setCinemaId] = useState(cinemas[0]?.id ?? 0);
  const [hallId, setHallId] = useState(0);
  const [date, setDate] = useState(TODAY);
  const [time, setTime] = useState("12:00");
  const [price, setPrice] = useState("499");

  const halls = hallsMap[cinemaId] ?? [];

  useEffect(() => {
    const h = (hallsMap[cinemaId] ?? [])[0];
    setHallId(h?.id ?? 0);
  }, [cinemaId, hallsMap]);

  const handleSave = () => {
    if (!movieId || !cinemaId || !hallId || !date || !time) return toast.error("Заполните все поля");

    onSave({
      id: 0, // Backend создаст ID
      movie_id: movieId,
      cinema_id: cinemaId,
      hall_id: hallId,
      start_time: `${date}T${time}:00Z`,
      base_price_cents: Math.round(snapPrice(parseInt(price) || 499) * 100),
      date,
      time,
      price: snapPrice(parseInt(price) || 499),
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
          <FSelect value={String(movieId)} onChange={(v) => setMovieId(Number(v))}>
            {movies.map((m) => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </FSelect>
        </Field>

        <Field label="Кинотеатр">
          <FSelect value={String(cinemaId)} onChange={(v) => setCinemaId(Number(v))}>
            {cinemas.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </FSelect>
        </Field>

        <Field label="Зал">
          <FSelect value={String(hallId)} onChange={(v) => setHallId(Number(v))}>
            {halls.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </FSelect>
        </Field>
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
  hallsMap: Record<number, { id: number; name: string }[]>;
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

  const handleDelete = async (id: number) => {
    if (!window.confirm("Удалить кинотеатр?")) return;
    try {
      await deleteCinema(id);
      setCinemas((p) => p.filter((c) => c.id !== id));
      toast.success("Кинотеатр удалён");
    } catch (e) {
      toast.error("Ошибка при удалении кинотеатра");
    }
  };

  const handleSaveCinema = async (data: ExtendedCinema) => {
    try {
      if (data.id) {
        await updateCinema(data.id, data);
        setCinemas((p) => p.map((c) => (c.id === data.id ? data : c)));
        toast.success("Кинотеатр обновлён");
      } else {
        const newCinema = await createCinema(data);
        setCinemas((p) => [...p, newCinema]);
        toast.success("Кинотеатр добавлен");
      }
      setPanelCinema(null);
    } catch (e: any) {
      toast.error(`Ошибка при сохранении кинотеатра: ${e.message}`);
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
                  Залы ({halls.length})
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
                    <span className="text-xs text-gray-600">Нет залов</span>
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
    facilitiesStr: cinema?.facilities?.join(", ") ?? "",
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f: any) => ({ ...f, [key]: value }));

  const handleSave = () => {
    if (!form.name?.trim()) return toast.error("Введите название кинотеатра");
    if (!form.city?.trim()) return toast.error("Введите город");
    if (!form.address?.trim()) return toast.error("Введите адрес");

    onSave({
      id: form.id,
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      rating: Number(form.rating) || 4.5,
      facilities: (form.facilitiesStr ?? "").split(",").map((s: string) => s.trim()).filter(Boolean),
      totalHalls: Number(form.totalHalls) || 1,
    });
  };

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

        <Field label="Город *">
          <FInput
            value={form.city ?? ""}
            onChange={(e) => set("city", e.target.value)}
            placeholder="Москва"
          />
        </Field>

        <Field label="Адрес *">
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

        <Field label="Удобства (через запятую)">
          <FInput
            value={form.facilitiesStr ?? ""}
            onChange={(e) => set("facilitiesStr", e.target.value)}
            placeholder="IMAX, 4DX, Парковка, VIP"
          />
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