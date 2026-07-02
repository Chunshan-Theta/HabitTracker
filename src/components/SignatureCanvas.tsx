"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { exportCompressedDoodle } from "@/lib/doodle-canvas";

type SignatureCanvasProps = {
  onComplete: (doodleImage: string) => Promise<void> | void;
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [locked, setLocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenStage, setFullscreenStage] = useState<"preview" | "active">(
    "preview"
  );
  const [hasStartedConfirm, setHasStartedConfirm] = useState(false);
  const lastPointsRef = useRef<Map<number, Point>>(new Map());
  const hasDrawnRef = useRef(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.lineCap = "round";
    ctx.lineWidth = 6;
  };

  const resetAll = () => {
    setLocked(false);
    hasDrawnRef.current = false;
    lastPointsRef.current.clear();
    clearCanvas();
  };

  const resetFullscreenState = () => {
    setFullscreenStage("preview");
    setIsFullscreen(false);
    void exitFullscreen();
  };

  useEffect(() => {
    resetAll();
    setIsFullscreen(false);
    setFullscreenStage("preview");
    setHasStartedConfirm(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("orientationchange", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("orientationchange", resizeCanvas);
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        void exitFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const closeFullscreen = async () => {
    setFullscreenStage("preview");
    setIsFullscreen(false);
    if (!document.fullscreenElement) return;

    try {
      await document.exitFullscreen();
    } catch {
      // Fall back to the in-app fullscreen layout below.
    }
  };

  const completeDoodle = async () => {
    if (locked || !hasDrawnRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) {
      resetAll();
      await closeFullscreen();
      return;
    }

    setLocked(true);

    try {
      const doodleImage = exportCompressedDoodle(canvas);
      navigator.vibrate?.([100, 50, 100, 50, 400]);
      await onComplete(doodleImage);
      await closeFullscreen();
    } catch {
      resetAll();
      await closeFullscreen();
    }
  };

  const exitFullscreen = async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
        return;
      } catch {
        // Fall back to the in-app fullscreen layout below.
      }
    }

    setIsFullscreen(false);
  };

  const confirmFullscreen = () => {
    setFullscreenStage("active");
  };

  const cancelFullscreen = () => {
    resetAll();
    resetFullscreenState();
    setHasStartedConfirm(false);
  };

  const isFullscreenPreview = isFullscreen && fullscreenStage === "preview";
  const isFullscreenActive = isFullscreen && fullscreenStage === "active";
  const canvasIsInteractive =
    !disabled &&
    !locked &&
    hasStartedConfirm &&
    (!isFullscreen || isFullscreenActive);

  const startConfirm = async () => {
    setHasStartedConfirm(true);
    setFullscreenStage("preview");
    const container = containerRef.current;
    if (!container) {
      setIsFullscreen(true);
      return;
    }

    if (container.requestFullscreen) {
      try {
        await container.requestFullscreen();
        setIsFullscreen(true);
        return;
      } catch {
        // Fall back to the in-app fullscreen layout below.
      }
    }

    setIsFullscreen(true);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasIsInteractive) return;
    if (event.touches.length < 2) return;

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
      hasDrawnRef.current = true;
      lastPointsRef.current.set(touch.identifier, { x, y });
    });
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasIsInteractive) return;
    if (event.touches.length < 2) {
      if (!hasDrawnRef.current) {
        resetAll();
        return;
      }

      void completeDoodle();
    }
  };

  const fullscreenClassName = isFullscreen
    ? "fixed inset-0 z-50 flex flex-col gap-4 bg-[#faf9f6] px-4 py-4 sm:px-6 sm:py-6"
    : "flex flex-col gap-4";

  const canvasShellClassName = isFullscreen
    ? "relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-[#f4d5da] bg-white/90 shadow-[var(--shadow-soft)]"
    : "relative rounded-2xl border border-[#f4d5da] bg-white/90 shadow-[var(--shadow-soft)]";

  const canvasClassName = isFullscreen
    ? "h-full w-full touch-none rounded-2xl"
    : "h-56 w-full touch-none rounded-2xl";

  return (
    <div ref={containerRef} className={fullscreenClassName}>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <p className="font-medium">{t("hint")}</p>
        <div className="flex flex-wrap items-center gap-2">
          {isFullscreenActive && (
            <button
              type="button"
              onClick={cancelFullscreen}
              className="rounded-full border border-[#f6a6b2] px-3 py-1 text-xs font-semibold text-[#d14c64]"
            >
              {t("cancelConfirm")}
            </button>
          )}
        </div>
      </div>
      <div className={canvasShellClassName}>
        <canvas
          ref={canvasRef}
          className={canvasClassName}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        />
        {!hasStartedConfirm && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl bg-white/85 px-6 text-center">
            <button
              type="button"
              onClick={() => void startConfirm()}
              className="rounded-full bg-[#f27c91] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#e7647b]"
            >
              {t("startConfirm")}
            </button>
          </div>
        )}
        {isFullscreenPreview && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl bg-white/85 px-6 text-center">
            <p className="text-sm font-medium text-slate-600">
              {t("fullscreenHint")}
            </p>
            <button
              type="button"
              onClick={confirmFullscreen}
              className="rounded-full bg-[#f27c91] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#e7647b]"
            >
              {t("confirmFullscreen")}
            </button>
          </div>
        )}
        {locked && !isFullscreen && (
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
