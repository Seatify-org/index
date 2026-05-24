import { motion } from "motion/react";
import type { Seat } from "../data/movies";

interface SeatGridProps {
  seats: Seat[];
  selectedSeats: string[];
  onSeatSelect: (seatId: string) => void;
  onSeatHover?: (seatId: string | null) => void;
}

export default function SeatGrid({
  seats,
  selectedSeats,
  onSeatSelect,
  onSeatHover,
}: SeatGridProps) {
  const rows = Array.from(
    new Set(seats.map((s) => s.row)),
  ).sort();
  const seatsPerRow = Math.max(...seats.map((s) => s.number));

  const getSeatId = (seat: Seat) => `${seat.row}${seat.number}`;

  const isBestSeat = (seat: Seat) => {
    // VIP seats should NEVER be marked as "Best View" - they are already premium
    if (seat.type === "vip") return false;

    const row = rows.indexOf(seat.row);
    const isMiddleRow = row >= 3 && row <= 5;
    const isMiddleSeat = seat.number >= 4 && seat.number <= 9;
    return isMiddleRow && isMiddleSeat && !seat.isOccupied;
  };

  const getSeatColor = (seat: Seat) => {
    const seatId = getSeatId(seat);

    // Occupied seats - always gray/disabled
    if (seat.isOccupied) {
      return "bg-gray-700/50 cursor-not-allowed border border-white/5";
    }

    // Selected seats - always purple gradient
    if (selectedSeats.includes(seatId)) {
      return "liquid-gradient shadow-lg shadow-purple-500/50 border border-purple-400";
    }

    // VIP seats - always gold/yellow tint
    if (seat.type === "vip") {
      return "bg-yellow-500/10 border border-yellow-500/40 hover:bg-yellow-500/20 cursor-pointer";
    }

    // Best View seats - always green tint
    if (isBestSeat(seat)) {
      return "bg-green-500/10 border border-green-500/40 hover:bg-green-500/20 cursor-pointer";
    }

    // Standard available seats - always neutral glass
    return "glass glass-hover cursor-pointer";
  };

  return (
    <div className="space-y-8">
      {/* Screen */}
      <div className="relative mb-12">
        <div className="h-2 liquid-gradient rounded-full shadow-lg shadow-purple-500/30" />
        <p className="text-center text-gray-400 text-xs mt-3 uppercase tracking-widest">
          Экран
        </p>
      </div>

      {/* Seats Grid */}
      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row}
            className="flex items-center justify-center gap-2"
          >
            {/* Row Label - Left */}
            <span className="w-6 text-center text-gray-500 font-semibold text-xs">
              {row}
            </span>

            {/* Seats */}
            <div className="flex gap-1.5">
              {Array.from({ length: seatsPerRow }, (_, i) => {
                const seat = seats.find(
                  (s) => s.row === row && s.number === i + 1,
                );
                if (!seat)
                  return <div key={i} className="w-7 h-7" />;

                const seatId = getSeatId(seat);
                const isSelected =
                  selectedSeats.includes(seatId);
                const isBest = isBestSeat(seat);

                // Build tooltip text
                const getSeatType = () => {
                  if (seat.type === "vip") return "VIP";
                  if (isBest) return "Лучший вид";
                  return "Обычное";
                };

                const tooltipText = `Ряд ${row} • Место ${i + 1} • ${getSeatType()}`;

                return (
                  <motion.button
                    key={seatId}
                    whileHover={
                      !seat.isOccupied
                        ? { scale: 1.1, y: -2 }
                        : {}
                    }
                    whileTap={
                      !seat.isOccupied ? { scale: 0.95 } : {}
                    }
                    onClick={() =>
                      !seat.isOccupied && onSeatSelect(seatId)
                    }
                    disabled={seat.isOccupied}
                    className={`relative w-7 h-7 rounded-lg transition-all ${getSeatColor(seat)}`}
                    title={
                      seat.isOccupied
                        ? `${seatId} - Занято`
                        : tooltipText
                    }
                    onMouseEnter={() => onSeatHover?.(seatId)}
                    onMouseLeave={() => onSeatHover?.(null)}
                  >
                    {/* Best Seat Glow */}
                    {isBest &&
                      !isSelected &&
                      !seat.isOccupied && (
                        <div className="absolute inset-0 bg-green-400/20 blur-md rounded-lg" />
                      )}

                    {/* Seat Number */}
                    <span className="text-[9px] font-semibold opacity-0 hover:opacity-100 transition-opacity">
                      {i + 1}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Row Label - Right */}
            <span className="w-6 text-center text-gray-500 font-semibold text-xs">
              {row}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-6 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 glass rounded-lg" />
          <span className="text-xs text-gray-400">
            Свободно
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 liquid-gradient rounded-lg" />
          <span className="text-xs text-gray-400">Выбрано</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-700/50 border border-white/5 rounded-lg" />
          <span className="text-xs text-gray-400">Занято</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-yellow-500/10 border border-yellow-500/40 rounded-lg" />
          <span className="text-xs text-gray-400">VIP</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-green-500/10 border border-green-500/40 rounded-lg" />
          <span className="text-xs text-gray-400">
            Лучший вид
          </span>
        </div>
      </div>
    </div>
  );
}