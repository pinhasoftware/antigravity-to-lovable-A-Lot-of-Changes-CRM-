import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

export function VideoPlayer({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [speed, setSpeed] = useState(1);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (ref.current) ref.current.playbackRate = speed;
  }, [speed]);

  return (
    <div className="space-y-2">
      <div className="aspect-video overflow-hidden rounded-xl bg-black">
        <video ref={ref} src={src} controls autoPlay playsInline className="h-full w-full" />
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-9 w-full items-center justify-between rounded-lg bg-secondary px-3 text-xs font-semibold"
        >
          <span className="text-muted-foreground">Velocidade</span>
          <span className="tabular-nums text-foreground">{speed}×</span>
        </button>
        {open && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setOpen(false)} 
            />
            <div className="absolute bottom-full left-0 right-0 z-20 mb-1 flex flex-wrap gap-1 rounded-lg border border-border bg-popover p-2 shadow-lg">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setSpeed(s); setOpen(false); }}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1.5 text-xs font-semibold tabular-nums transition-colors",
                    s === speed ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
                  )}
                >
                  {s}×
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
