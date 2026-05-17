"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type SignatureCanvasProps = {
  onComplete: () => Promise<void> | void;
  resetKey: number;
  disabled?: boolean;
  disabledMessage?: string;
};

type Point = { x: number; y: number };

const BLUE = "#AEC6CF";
const ORANGE = "#FFB347";

export default function SignatureCanvas({
  onComplete,
  resetKey,
  disabled = false,
  disabledMessage,
}: SignatureCanvasProps) {
  const t = useTranslations("canvas");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [locked, setLocked] = useState(false);
  const lastPointsRef = useRef<Map<number, Point>>(new Map());

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const resetAll = () => {
    setProgress(0);
    setLocked(false);
    startTimeRef.current = null;
    lastPointsRef.current.clear();
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    clearCanvas();
  };

  useEffect(() => {
    resetAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        ctx.lineCap = "round";
        ctx.lineWidth = 6;
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const updateProgress = () => {
    if (!startTimeRef.current) return;
    const elapsed = performance.now() - startTimeRef.current;
    const nextProgress = Math.min(elapsed / 3000, 1);
    setProgress(nextProgress);

    if (nextProgress >= 1) {
      setLocked(true);
      startTimeRef.current = null;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      void onComplete();
      return;
    }

    frameRef.current = requestAnimationFrame(updateProgress);
  };

  const ensureProgress = () => {
    if (!startTimeRef.current) {
      startTimeRef.current = performance.now();
      frameRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled || locked) return;
    if (event.touches.length !== 2) {
      resetAll();
      return;
    }
    ensureProgress();
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled || locked) return;
    if (event.touches.length !== 2) {
      resetAll();
      return;
    }

    event.preventDefault();
    navigator.vibrate?.(10);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const touches = Array.from(event.touches).slice(0, 2);
    const colors = [BLUE, ORANGE];

    touches.forEach((touch, index) => {
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const last = lastPointsRef.current.get(touch.identifier);
      ctx.strokeStyle = colors[index];
      ctx.beginPath();
      if (last) {
        ctx.moveTo(last.x, last.y);
      } else {
        ctx.moveTo(x, y);
      }
      ctx.lineTo(x, y);
      ctx.stroke();
      lastPointsRef.current.set(touch.identifier, { x, y });
    });
  };

  const handleTouchEnd = () => {
    if (disabled || locked) return;
    resetAll();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span className="font-medium">{t("progress")}</span>
        <span className="tabular-nums">{Math.round(progress * 100)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#f27c91] transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <div className="relative rounded-2xl border border-[#f4d5da] bg-white/90 shadow-[var(--shadow-soft)]">
        <canvas
          ref={canvasRef}
          className="h-56 w-full rounded-2xl touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        />
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/80 text-sm font-medium text-slate-600">
            {t("complete")}
          </div>
        )}
        {disabled && !locked && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/80 text-sm font-medium text-slate-600">
            {disabledMessage}
          </div>
        )}
      </div>
    </div>
  );
}
