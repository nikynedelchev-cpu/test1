
import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { ACTIVITIES } from './constants';
import type { CurrentEntry, LogEntry } from './types';

// Helper Functions
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString("bg-BG", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (hours > 0) {
    return `${hours} ч ${remMinutes} мин`;
  }
  return `${remMinutes} мин`;
};


// --- Reusable Child Components ---

interface ReelProps {
  activities: string[];
}

const Reel = forwardRef<HTMLDivElement, ReelProps>(({ activities }, ref) => {
  const internalRef = ref as React.RefObject<HTMLDivElement>;

  useEffect(() => {
    if (internalRef.current) {
      // On load, scroll to the middle
      internalRef.current.scrollTop = (internalRef.current.scrollHeight - internalRef.current.clientHeight) / 2;
    }
  }, [internalRef]);

  return (
    <div className="rounded-2xl p-2 bg-gray-800 shadow-lg mb-4">
      <div className="text-center mb-1 text-sm text-gray-400">Плъзни и избери активност</div>
      <div
        ref={internalRef}
        className="w-full h-40 overflow-y-scroll snap-y snap-mandatory rounded-xl border border-gray-700 bg-black custom-scrollbar"
      >
        {activities.map((name) => (
          <div key={name} className="p-3 text-center text-lg snap-center border-b border-gray-800 last:border-b-0 cursor-default">
            {name}
          </div>
        ))}
      </div>
    </div>
  );
});

interface CurrentActivityProps {
  entry: CurrentEntry | null;
}

const CurrentActivity: React.FC<CurrentActivityProps> = ({ entry }) => (
  <div className="p-3 rounded-xl bg-slate-800">
    <span className="text-gray-400 text-xs uppercase tracking-wider block mb-1">Текуща активност</span>
    <div>{entry ? `${entry.name} (от ${formatTime(entry.start)})` : "няма"}</div>
  </div>
);

interface SleepInfoProps {
  info: string | null;
}

const SleepInfo: React.FC<SleepInfoProps> = ({ info }) => {
  if (!info) return null;
  return (
    <div className="p-2 px-3 rounded-lg bg-emerald-900/50 border border-emerald-800 text-sm text-emerald-300">
      {info}
    </div>
  );
};

interface LogItemProps {
  entry: LogEntry;
}

const LogItem: React.FC<LogItemProps> = ({ entry }) => (
  <div className="p-2 px-3 rounded-lg bg-slate-800 mb-2 text-sm transition-opacity duration-300 animate-fade-in">
    <div className="font-semibold mb-0.5">{entry.name}</div>
    <div className="text-gray-300 text-xs">{`от ${formatTime(entry.start)} до ${formatTime(entry.end)}`}</div>
    <div className="text-yellow-400 text-xs mt-0.5">{`Продължителност: ${formatDuration(entry.end.getTime() - entry.start.getTime())}`}</div>
  </div>
);


// --- Main App Component ---

const App: React.FC = () => {
  const [currentEntry, setCurrentEntry] = useState<CurrentEntry | null>(null);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [sleepInfo, setSleepInfo] = useState<string | null>(null);
  const reelRef = useRef<HTMLDivElement>(null);

  const getSelectedActivityName = (): string => {
    const reel = reelRef.current;
    if (!reel) return ACTIVITIES[0];
    
    const reelRect = reel.getBoundingClientRect();
    const centerY = reelRect.top + reelRect.height / 2;

    const items = Array.from(reel.querySelectorAll(".snap-center")) as HTMLElement[];
    let closestItem: HTMLElement | null = null;
    let closestDist = Infinity;

    items.forEach(item => {
      const r = item.getBoundingClientRect();
      const itemCenterY = r.top + r.height / 2;
      const dist = Math.abs(itemCenterY - centerY);
      if (dist < closestDist) {
        closestDist = dist;
        closestItem = item;
      }
    });
    
    return closestItem ? closestItem.textContent || ACTIVITIES[0] : ACTIVITIES[0];
  };

  const handleStartClick = () => {
    const now = new Date();
    const newActivityName = getSelectedActivityName();

    setSleepInfo(null); // Clear previous sleep info on any new activity

    if (currentEntry) {
      const finishedEntry: LogEntry = {
        name: currentEntry.name,
        start: currentEntry.start,
        end: now,
      };
      setLogEntries(prev => [finishedEntry, ...prev]);

      if (currentEntry.name === "Лягане" && newActivityName === "Ставане") {
        const sleepMs = now.getTime() - currentEntry.start.getTime();
        setSleepInfo(`Сън: ${formatDuration(sleepMs)} (от ${formatTime(currentEntry.start)} до ${formatTime(now)})`);
      }
    }

    setCurrentEntry({ name: newActivityName, start: now });
  };

  return (
    <div className="bg-gray-900 text-gray-100 font-sans min-h-screen flex flex-col">
      <main className="max-w-md w-full mx-auto p-4 flex-grow">
        <h1 className="text-2xl font-bold text-center mb-4">Дневен револвер</h1>
        
        <Reel ref={reelRef} activities={ACTIVITIES} />

        <div className="flex flex-col gap-2">
          <button 
            onClick={handleStartClick}
            className="w-full py-3 px-4 text-base font-semibold rounded-full border-none cursor-pointer bg-blue-600 text-white active:opacity-80 active:scale-[0.98] transition-transform duration-100"
          >
            Старт / смяна на активност
          </button>
          
          <CurrentActivity entry={currentEntry} />
          
          <SleepInfo info={sleepInfo} />
          
          <p className="text-xs text-center text-gray-500 mt-1.5 px-2">
            Логика: всяко натискане затваря предишната активност и стартира нова, измервайки продължителността.
          </p>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Лог</h2>
          <div className="max-h-96 overflow-y-auto custom-scrollbar pr-1">
            {logEntries.length > 0 ? (
              logEntries.map((entry, index) => <LogItem key={`${entry.start.getTime()}-${index}`} entry={entry} />)
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">Няма записани активности.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
