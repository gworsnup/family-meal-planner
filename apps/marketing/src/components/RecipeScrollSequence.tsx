"use client";

/**
 * Tweak checklist:
 * - Frame count: update DEFAULT_FRAME_COUNT or pass frameCount
 * - Frame path pattern: update frameSrc()
 * - Background color: adjust LOADER_BG or parent section styles
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { isMotionValue, useReducedMotion, type MotionValue } from "framer-motion";

const DEFAULT_FRAME_COUNT = 192;
const LOADER_BG = "rgba(255, 255, 255, 0.85)";

const frameSrc = (index: number) =>
  `/assets/recipe_animation/frame_${String(index).padStart(
    3,
    "0",
  )}_delay-0.042s.jpg`;

type LoaderState = {
  progress: number;
  isReady: boolean;
};

function useFramePreload({
  reducedMotion,
  frameCount,
  staticFrameIndex,
}: {
  reducedMotion: boolean;
  frameCount: number;
  staticFrameIndex: number;
}) {
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [loader, setLoader] = useState<LoaderState>({
    progress: 0,
    isReady: false,
  });

  useEffect(() => {
    let isMounted = true;

    const updateProgress = (loaded: number, total: number) => {
      const progress = Math.min(100, Math.round((loaded / total) * 100));
      if (!isMounted) return;
      setLoader((prev) => {
        const nextState = {
          progress,
          isReady: prev.isReady || loaded > 0,
        };
        if (
          prev.progress === nextState.progress &&
          prev.isReady === nextState.isReady
        ) {
          return prev;
        }
        return nextState;
      });
    };

    if (reducedMotion) {
      const img = new Image();
      img.src = frameSrc(staticFrameIndex);
      let settled = false;
      const finalize = () => {
        if (settled) return;
        settled = true;
        if (!isMounted) return;
        imagesRef.current = [img];
        setLoader({ progress: 100, isReady: true });
      };
      img.onload = finalize;
      img.onerror = finalize;
      const decodePromise = img.decode?.();
      if (decodePromise) {
        decodePromise.then(finalize).catch(finalize);
      }
      return () => {
        isMounted = false;
      };
    }

    let loadedCount = 0;
    imagesRef.current = new Array(frameCount);

    const handleLoad = (index: number, image: HTMLImageElement) => {
      loadedCount += 1;
      if (!isMounted) return;
      imagesRef.current[index] = image;
      updateProgress(loadedCount, frameCount);
    };

    for (let i = 0; i < frameCount; i += 1) {
      const img = new Image();
      img.src = frameSrc(i);
      let settled = false;
      const finalize = () => {
        if (settled) return;
        settled = true;
        handleLoad(i, img);
      };
      img.onload = finalize;
      img.onerror = finalize;
      const decodePromise = img.decode?.();
      if (decodePromise) {
        decodePromise.then(finalize).catch(finalize);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [frameCount, reducedMotion, staticFrameIndex]);

  return { imagesRef, loader };
}

function drawContain(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  dpr: number,
) {
  const context = canvas.getContext("2d");
  if (!context) return;

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);

  const scale = Math.min(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;

  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

type RecipeScrollSequenceProps = {
  progress?: number | MotionValue<number>;
  frameCount?: number;
  startIndex?: number;
  endIndex?: number;
  className?: string;
};

function useCanvasSizer() {
  const syncCanvasSize = (canvas: HTMLCanvasElement, dpr: number) => {
    const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== width) {
      canvas.width = width;
    }
    if (canvas.height !== height) {
      canvas.height = height;
    }
  };

  return { syncCanvasSize };
}

function AnimatedSequence({
  progress,
  frameCount = DEFAULT_FRAME_COUNT,
  startIndex = 0,
  endIndex,
  className,
}: RecipeScrollSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const currentFrameRef = useRef(0);
  const lastFrameRef = useRef<number | null>(null);
  const resolvedEndIndex = Math.max(
    0,
    Math.min(
      endIndex ?? frameCount - 1,
      frameCount - 1,
    ),
  );
  const resolvedStartIndex = Math.max(
    0,
    Math.min(startIndex, resolvedEndIndex),
  );
  const { imagesRef, loader } = useFramePreload({
    reducedMotion: false,
    frameCount,
    staticFrameIndex: resolvedStartIndex,
  });
  const { syncCanvasSize } = useCanvasSizer();

  const resolvedProgress = useMemo(() => {
    if (typeof progress === "number") return progress;
    if (progress && isMotionValue(progress)) return progress.get();
    return 0;
  }, [progress]);

  const clampProgress = (value: number) =>
    Math.min(1, Math.max(0, value));

  const resolveFrameIndex = (value: number) => {
    const clamped = clampProgress(value);
    const span = resolvedEndIndex - resolvedStartIndex;
    return Math.round(resolvedStartIndex + span * clamped);
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    syncCanvasSize(canvas, dpr);
    const image = imagesRef.current[currentFrameRef.current];
    if (image) {
      drawContain(canvas, image, dpr);
    }
  };

  const scheduleDraw = (index: number) => {
    const canvas = canvasRef.current;
    const image = imagesRef.current[index];
    if (!canvas || !image) return;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const dpr = window.devicePixelRatio || 1;
      syncCanvasSize(canvas, dpr);
      drawContain(canvas, image, dpr);
    });
  };

  const updateFrame = (value: number) => {
    if (!loader.isReady) return;
    const nextIndex = Math.min(
      resolvedEndIndex,
      Math.max(resolvedStartIndex, resolveFrameIndex(value)),
    );
    if (!imagesRef.current[nextIndex]) return;
    if (lastFrameRef.current === nextIndex) return;
    currentFrameRef.current = nextIndex;
    lastFrameRef.current = nextIndex;
    scheduleDraw(nextIndex);
  };

  useEffect(() => {
    if (!loader.isReady) return;
    const initialIndex = resolveFrameIndex(resolvedProgress);
    currentFrameRef.current = initialIndex;
    lastFrameRef.current = initialIndex;
    scheduleDraw(initialIndex);
  }, [loader.isReady, resolvedProgress]);

  useEffect(() => {
    if (!loader.isReady) return undefined;
    if (progress && isMotionValue(progress)) {
      const unsubscribe = progress.on("change", (latest) => {
        updateFrame(latest);
      });
      return () => {
        unsubscribe();
      };
    }
    updateFrame(resolvedProgress);
    return undefined;
  }, [loader.isReady, progress, resolvedProgress]);

  useEffect(() => {
    if (!loader.isReady) return undefined;
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [loader.isReady]);

  return (
    <div
      className={`absolute inset-0 h-full w-full ${className ?? ""}`.trim()}
      aria-hidden="true"
    >
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            backgroundColor: "#fff",
            opacity: loader.isReady ? 1 : 0,
          }}
        />
        {loader.progress < 100 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: LOADER_BG,
              pointerEvents: "none",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "min(240px, 70vw)",
                  height: 4,
                  background: "rgba(15, 23, 42, 0.15)",
                  borderRadius: 999,
                  overflow: "hidden",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: `${loader.progress}%`,
                    height: "100%",
                    background: "#0f172a",
                    transition: "width 0.2s ease",
                  }}
                />
              </div>
              <span style={{ fontSize: 12, color: "#0f172a" }}>
                Loading {loader.progress}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReducedMotionSequence({
  frameCount = DEFAULT_FRAME_COUNT,
  startIndex = 0,
  endIndex,
  className,
}: RecipeScrollSequenceProps) {
  const resolvedEndIndex = Math.max(
    0,
    Math.min(
      endIndex ?? frameCount - 1,
      frameCount - 1,
    ),
  );
  const resolvedStartIndex = Math.max(
    0,
    Math.min(startIndex, resolvedEndIndex),
  );
  const { imagesRef, loader } = useFramePreload({
    reducedMotion: true,
    frameCount,
    staticFrameIndex: resolvedStartIndex,
  });
  const image = imagesRef.current[0];

  return (
    <div
      className={`absolute inset-0 h-full w-full ${className ?? ""}`.trim()}
      aria-hidden="true"
    >
      {image ? (
        <img
          src={image.src}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
          }}
        />
      ) : (
        <img
          src={frameSrc(resolvedStartIndex)}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            opacity: loader.isReady ? 1 : 0,
          }}
        />
      )}
      {loader.progress < 100 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: LOADER_BG,
            pointerEvents: "none",
          }}
        >
          <span style={{ fontSize: 12, color: "#0f172a" }}>
            Loading {loader.progress}%
          </span>
        </div>
      )}
    </div>
  );
}

export default function RecipeScrollSequence({
  progress,
  frameCount,
  startIndex,
  endIndex,
  className,
}: RecipeScrollSequenceProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <ReducedMotionSequence
        frameCount={frameCount}
        startIndex={startIndex}
        endIndex={endIndex}
        className={className}
      />
    );
  }

  return (
    <AnimatedSequence
      progress={progress}
      frameCount={frameCount}
      startIndex={startIndex}
      endIndex={endIndex}
      className={className}
    />
  );
}
