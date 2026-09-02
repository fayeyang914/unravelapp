import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const PHASES = [
  { label: "Breathe in", seconds: 4, scale: 1 },
  { label: "Hold", seconds: 4, scale: 1 },
  { label: "Breathe out", seconds: 6, scale: 0.62 },
];

const BreathingSession = ({ onDone }: { onDone?: () => void }) => {
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [count, setCount] = useState(PHASES[0].seconds);
  const [cycles, setCycles] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    timer.current = window.setInterval(() => {
      setCount((c) => {
        if (c > 1) return c - 1;
        setPhase((p) => {
          const next = (p + 1) % PHASES.length;
          if (next === 0) setCycles((n) => n + 1);
          setCount(PHASES[next].seconds);
          return next;
        });
        return PHASES[(phase + 1) % PHASES.length].seconds;
      });
    }, 1000);
    return () => timer.current && window.clearInterval(timer.current);
  }, [running, phase]);

  useEffect(() => {
    if (cycles >= 4 && running) {
      setRunning(false);
      onDone?.();
    }
  }, [cycles, running, onDone]);

  const current = PHASES[phase];

  return (
    <div className="flex flex-col items-center gap-8 py-6">
      <div className="relative flex h-56 w-56 items-center justify-center">
        <div
          className="absolute inset-0 rounded-full bg-accent/15"
          style={{
            transform: `scale(${running ? current.scale : 0.8})`,
            transition: `transform ${current.seconds}s cubic-bezier(0.4, 0, 0.2, 1)`,
          }}
        />
        <div className="absolute inset-6 rounded-full border border-accent/30" />
        <div className="relative text-center">
          <p className="font-display text-2xl">{running ? current.label : "4 · 4 · 6"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {running ? `${count}` : "Four slow cycles, about a minute."}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant={running ? "secondary" : "default"}
          onClick={() => {
            if (running) {
              setRunning(false);
            } else {
              setPhase(0);
              setCount(PHASES[0].seconds);
              setCycles(0);
              setRunning(true);
            }
          }}
          className="rounded-full px-6"
        >
          {running ? "Pause" : cycles >= 4 ? "Again" : "Begin"}
        </Button>
        {cycles > 0 && <span className="text-sm text-muted-foreground">{cycles} of 4 cycles</span>}
      </div>
    </div>
  );
};

export default BreathingSession;
