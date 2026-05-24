import { Link } from "react-router";
import { Home, Film } from "lucide-react";
import { motion } from "motion/react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-purple-500/30 blur-3xl" />
          <h1 className="relative text-9xl font-bold liquid-gradient bg-clip-text text-transparent">
            404
          </h1>
        </div>

        <div className="mb-8 glass-strong rounded-2xl p-8 inline-block">
          <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">
            Страница не найдена
          </h2>
          <p className="text-gray-400 text-lg">
            Упс! Страница, которую вы ищете, не существует.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-4 liquid-gradient hover:shadow-lg hover:shadow-purple-500/50 rounded-xl font-semibold transition-all duration-300"
        >
          <Home className="w-5 h-5" />
          На главную
        </Link>
      </motion.div>
    </div>
  );
}