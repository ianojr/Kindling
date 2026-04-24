"use client";
import { useRef, useState, useEffect, useCallback } from "react";

interface Props {
  children: React.ReactNode[];
  autoPlay?: boolean;
  interval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  className?: string;
  itemsPerView?: number;
}

export function Carousel({
  children, autoPlay = true, interval = 4500,
  showDots = true, showArrows = true, className = "", itemsPerView = 1,
}: Props) {
  const [current, setCurrent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const total = children.length;

  const go = useCallback((idx: number) => {
    setCurrent(((idx % total) + total) % total);
  }, [total]);

  const next = useCallback(() => go(current + 1), [current, go]);
  const prev = useCallback(() => go(current - 1), [current, go]);

  useEffect(() => {
    if (!autoPlay) return;
    timerRef.current = setInterval(next, interval);
    return () => clearInterval(timerRef.current);
  }, [autoPlay, interval, next]);

  const pause = () => clearInterval(timerRef.current);
  const resume = () => { if (autoPlay) timerRef.current = setInterval(next, interval); };

  // Touch/drag
  const onPointerDown = (e: React.PointerEvent) => {
    setIsDragging(true); setDragStart(e.clientX); pause();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - dragStart;
    if (Math.abs(delta) > 40) delta < 0 ? next() : prev();
    setIsDragging(false); resume();
  };

  const offset = -(current * (100 / itemsPerView));

  return (
    <div className={`relative ${className}`} onMouseEnter={pause} onMouseLeave={resume}>
      {/* Track */}
      <div className="overflow-hidden rounded-2xl" style={{ cursor: isDragging ? "grabbing" : "grab" }}>
        <div
          ref={trackRef}
          className="flex"
          style={{ transform: `translateX(${offset}%)`, transition: isDragging ? "none" : "transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)", willChange: "transform" }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => { setIsDragging(false); resume(); }}
        >
          {children.map((child, i) => (
            <div key={i} className="shrink-0" style={{ width: `${100 / itemsPerView}%`, padding: "0 0.5rem" }}>
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Arrows */}
      {showArrows && total > 1 && (
        <>
          <button onClick={prev} aria-label="Previous"
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full transition-all z-10"
            style={{ background: "rgba(8,8,9,0.8)", border: "1px solid var(--border-mid)", backdropFilter: "blur(12px)", color: "var(--fg-2)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color="var(--orange)"; (e.currentTarget as HTMLElement).style.borderColor="var(--border-hover)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color="var(--fg-2)"; (e.currentTarget as HTMLElement).style.borderColor="var(--border-mid)"; }}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button onClick={next} aria-label="Next"
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full transition-all z-10"
            style={{ background: "rgba(8,8,9,0.8)", border: "1px solid var(--border-mid)", backdropFilter: "blur(12px)", color: "var(--fg-2)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color="var(--orange)"; (e.currentTarget as HTMLElement).style.borderColor="var(--border-hover)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color="var(--fg-2)"; (e.currentTarget as HTMLElement).style.borderColor="var(--border-mid)"; }}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </>
      )}

      {/* Dots */}
      {showDots && total > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2">
          {children.map((_, i) => (
            <button key={i} onClick={() => { go(i); pause(); setTimeout(resume, 300); }}
              aria-label={`Slide ${i + 1}`}
              className="rounded-full transition-all duration-300"
              style={{
                height: "6px",
                width: i === current ? "24px" : "6px",
                background: i === current ? "var(--orange)" : "var(--bg-4)",
                boxShadow: i === current ? "0 0 8px var(--orange-glow)" : "none",
              }} />
          ))}
        </div>
      )}
    </div>
  );
}
