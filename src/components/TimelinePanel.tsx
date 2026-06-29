import type { RadarProduct } from "../lib/radar";

interface TimelinePanelProps {
  timestamps: Date[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  product: RadarProduct;
  onProductChange: (product: RadarProduct) => void;
  loading: boolean;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function TimelinePanel({
  timestamps,
  selectedIndex,
  onSelectIndex,
  product,
  onProductChange,
  loading,
}: TimelinePanelProps) {
  const currentTime =
    timestamps[selectedIndex] ? formatTime(timestamps[selectedIndex]) : "--:--";

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-slate-800/95 backdrop-blur-sm text-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]">
      <div className="flex items-center gap-3 mb-2">
        {/* Product switcher */}
        <div className="flex rounded-lg overflow-hidden border border-slate-600 text-sm">
          <button
            onClick={() => onProductChange("maxz")}
            className={`px-3 py-1 transition-colors cursor-pointer ${
              product === "maxz"
                ? "bg-cyan-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            maxZ
          </button>
          <button
            onClick={() => onProductChange("merge1h")}
            className={`px-3 py-1 transition-colors cursor-pointer ${
              product === "merge1h"
                ? "bg-cyan-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            1h merge
          </button>
        </div>

        {/* Current time display */}
        <span className="text-sm font-mono flex-1 text-center">
          {loading ? "Loading..." : currentTime}
        </span>

        {/* Frame indicator */}
        <span className="text-xs text-slate-400">
          {timestamps.length > 0
            ? `${selectedIndex + 1}/${timestamps.length}`
            : ""}
        </span>
      </div>

      {/* Timeline slider */}
      <input
        type="range"
        min={0}
        max={Math.max(0, timestamps.length - 1)}
        value={selectedIndex >= 0 ? selectedIndex : 0}
        onChange={(e) => onSelectIndex(Number(e.target.value))}
        disabled={timestamps.length === 0}
        aria-label="Radar timeline"
        className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-50"
      />
    </div>
  );
}
