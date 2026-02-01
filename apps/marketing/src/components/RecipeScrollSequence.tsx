"use client";

/**
 * Tweak checklist:
 * - Frame count: update DEFAULT_FRAME_COUNT or pass frameCount
 * - Frame path pattern: update frameSrc()
 * - Background color: adjust LOADER_BG or parent section styles
 */
import { useEffect, useRef, useState, type RefObject } from "react";
import { useReducedMotion } from "framer-motion";

const DEFAULT_FRAME_COUNT = 192;
const KEYFRAME_STEP = 6;
const CONCURRENCY = 6;
const LOADER_HIDE_THRESHOLD = 0.3;
const LOADER_BG = "rgba(255, 255, 255, 0.85)";

const frameSrc = (index: number) =>
  `/assets/recipe_animation/frame_${String(index).padStart(
    3,
    "0",
  )}_delay-0.042s.webp`;

const frameSrcFallback = (index: number) =>
  `/assets/recipe_animation/frame_${String(index).padStart(
    3,
    "0",
  )}_delay-0.042s.jpg`;

const isUsableImage = (img?: HTMLImageElement) =>
  !!img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;

type LoaderState = {
  keyframeProgress: number;
  isFrameReady: boolean;
  showOverlay: boolean;
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
    keyframeProgress: 0,
    isFrameReady: false,
    showOverlay: true,
  });

  useEffect(() => {
    let isMounted = true;
    let idleHandle: number | null = null;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    const loadImage = async (src: string) => {
      const img = new Image();
      img.src = src;
      const finalizePromise = new Promise<void>((resolve) => {
        const done = () => resolve();
        img.onload = done;
        img.onerror = done;
      });
      const decodePromise = img.decode?.();
      try {
        if (decodePromise) {
          await decodePromise;
        } else {
          await finalizePromise;
        }
      } catch {
        await finalizePromise;
      }
      return img;
    };

    const updateProgress = (loadedKeyframes: number, totalKeyframes: number) => {
      if (!isMounted) return;
      const safeTotal = Math.max(1, totalKeyframes);
      const keyframeProgress = Math.min(
        100,
        Math.round((loadedKeyframes / safeTotal) * 100),
      );
      const isFrameReady = isUsableImage(imagesRef.current[0]);
      const shouldHideOverlay =
        isFrameReady &&
        loadedKeyframes / safeTotal >= LOADER_HIDE_THRESHOLD;
      setLoader((prev) => {
        const showOverlay = prev.showOverlay && !shouldHideOverlay;
        if (
          prev.keyframeProgress === keyframeProgress &&
          prev.isFrameReady === isFrameReady &&
          prev.showOverlay === showOverlay
        ) {
          return prev;
        }
        return {
          keyframeProgress,
          isFrameReady,
          showOverlay,
        };
      });
    };

    if (reducedMotion) {
      const loadReducedFrame = async () => {
        const preferred = await loadImage(frameSrc(staticFrameIndex));
        if (!isMounted) return;
        if (isUsableImage(preferred)) {
          imagesRef.current = [preferred];
          setLoader({
            keyframeProgress: 100,
            isFrameReady: true,
            showOverlay: false,
          });
          return;
        }
        const fallback = await loadImage(frameSrcFallback(staticFrameIndex));
        if (!isMounted) return;
        imagesRef.current = isUsableImage(fallback) ? [fallback] : [];
        setLoader({
          keyframeProgress: 100,
          isFrameReady: true,
          showOverlay: false,
        });
      };
      loadReducedFrame();
      return () => {
        isMounted = false;
      };
    }

    const startIndex = 0;
    const endIndex = frameCount - 1;
    imagesRef.current = new Array(frameCount);
    const failedIndices = new Set<number>();
    const loadedIndices = new Set<number>();
    const keyframeIndices = new Set<number>();
    const loadedKeyframes = new Set<number>();

    for (let i = startIndex; i <= endIndex; i += KEYFRAME_STEP) {
      keyframeIndices.add(i);
    }

    const updateLoader = () => {
      updateProgress(loadedKeyframes.size, keyframeIndices.size);
    };

    const applyResult = (index: number, image: HTMLImageElement) => {
      if (isUsableImage(image)) {
        imagesRef.current[index] = image;
        failedIndices.delete(index);
        loadedIndices.add(index);
        if (keyframeIndices.has(index)) {
          loadedKeyframes.add(index);
        }
      } else {
        failedIndices.add(index);
      }
    };

    const runQueue = async (indices: number[]) => {
      let cursor = 0;
      const queued = indices.filter((index) => !loadedIndices.has(index));
      const worker = async () => {
        while (cursor < queued.length && isMounted) {
          const current = queued[cursor];
          cursor += 1;
          const image = await loadImage(frameSrc(current));
          if (!isMounted) return;
          applyResult(current, image);
          updateLoader();
        }
      };

      await Promise.all(
        Array.from(
          { length: Math.min(CONCURRENCY, queued.length) },
          () => worker(),
        ),
      );
    };

    const loadTier0 = async () => {
      const image = await loadImage(frameSrc(startIndex));
      if (!isMounted) return;
      applyResult(startIndex, image);
      updateLoader();
      if (endIndex !== startIndex) {
        const endImage = await loadImage(frameSrc(endIndex));
        if (!isMounted) return;
        applyResult(endIndex, endImage);
        updateLoader();
      }
    };

    const loadTier1 = async () => {
      const indices = Array.from(keyframeIndices);
      await runQueue(indices);
    };

    const loadTier2 = async () => {
      const indices = [];
      for (let i = startIndex; i <= endIndex; i += 1) {
        if (!keyframeIndices.has(i)) {
          indices.push(i);
        }
      }
      await runQueue(indices);
      if (!isMounted || failedIndices.size === 0) return;
      const retryIndices = Array.from(failedIndices);
      await runQueue(retryIndices);
      updateLoader();
    };

    const scheduleTier2 = () => {
      if (!isMounted) return;
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        idleHandle = window.requestIdleCallback(() => {
          idleHandle = null;
          if (!isMounted) return;
          void loadTier2();
        });
      } else {
        timeoutHandle = setTimeout(() => {
          timeoutHandle = null;
          if (!isMounted) return;
          void loadTier2();
        }, 0);
      }
    };

    const loadFrames = async () => {
      await loadTier0();
      if (!isMounted) return;
      await loadTier1();
      scheduleTier2();
    };

    loadFrames();

    return () => {
      isMounted = false;
      if (idleHandle !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
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

  // Use the logical width/height (buffer size / dpr) to avoid layout thrashing
  // caused by reading clientWidth/clientHeight
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;

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
  progressRef: RefObject<number>;
  frameCount?: number;
  startIndex?: number;
  endIndex?: number;
  className?: string;
};

type ReducedMotionSequenceProps = Omit<
  RecipeScrollSequenceProps,
  "progressRef"
>;

function AnimatedSequence({
  progressRef,
  frameCount = DEFAULT_FRAME_COUNT,
  startIndex = 0,
  endIndex,
  className,
}: RecipeScrollSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const resizeRafRef = useRef<number | null>(null);
  const dprRef = useRef(1);
  const canvasSizeRef = useRef({
    width: 0,
    height: 0,
    dpr: 0,
  });
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

  const clampProgress = (value: number) =>
    Math.min(1, Math.max(0, value));

  const resolveFrameIndex = (value: number) => {
    const clamped = clampProgress(value);
    const span = resolvedEndIndex - resolvedStartIndex;
    return Math.floor(resolvedStartIndex + span * clamped);
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const clientWidth = canvas.clientWidth;
    const clientHeight = canvas.clientHeight;
    if (
      clientWidth === canvasSizeRef.current.width &&
      clientHeight === canvasSizeRef.current.height &&
      dpr === canvasSizeRef.current.dpr
    ) {
      return;
    }
    const width = Math.max(1, Math.floor(clientWidth * dpr));
    const height = Math.max(1, Math.floor(clientHeight * dpr));
    canvasSizeRef.current = { width: clientWidth, height: clientHeight, dpr };
    canvas.width = width;
    canvas.height = height;
    dprRef.current = dpr;
  };

  const drawFrame = (index: number) => {
    const canvas = canvasRef.current;
    const image = imagesRef.current[index];
    if (!canvas || !isUsableImage(image)) return;
    drawContain(canvas, image, dprRef.current || 1);
    lastFrameRef.current = index;
  };

  const findNearestUsableFrame = (targetIndex: number) => {
    if (isUsableImage(imagesRef.current[targetIndex])) {
      return targetIndex;
    }
    for (let i = targetIndex - 1; i >= resolvedStartIndex; i -= 1) {
      if (isUsableImage(imagesRef.current[i])) {
        return i;
      }
    }
    for (let i = targetIndex + 1; i <= resolvedEndIndex; i += 1) {
      if (isUsableImage(imagesRef.current[i])) {
        return i;
      }
    }
    return null;
  };

  useEffect(() => {
    resizeCanvas();
    const handleResize = () => {
      if (resizeRafRef.current !== null) {
        cancelAnimationFrame(resizeRafRef.current);
      }
      resizeRafRef.current = requestAnimationFrame(() => {
        resizeRafRef.current = null;
        resizeCanvas();
        if (lastFrameRef.current !== null) {
          drawFrame(lastFrameRef.current);
        }
      });
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeRafRef.current !== null) {
        cancelAnimationFrame(resizeRafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!loader.isFrameReady) return;
    const initialIndex = resolveFrameIndex(progressRef.current ?? 0);
    const resolvedInitial = findNearestUsableFrame(initialIndex);
    if (resolvedInitial !== null) {
      drawFrame(resolvedInitial);
    }
    const tick = () => {
      const nextIndex = Math.min(
        resolvedEndIndex,
        Math.max(
          resolvedStartIndex,
          resolveFrameIndex(progressRef.current ?? 0),
        ),
      );
      const resolvedIndex = findNearestUsableFrame(nextIndex);
      if (
        resolvedIndex !== null &&
        resolvedIndex !== lastFrameRef.current
      ) {
        drawFrame(resolvedIndex);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [
    loader.isFrameReady,
    progressRef,
    resolvedEndIndex,
    resolvedStartIndex,
  ]);

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
            opacity: loader.isFrameReady ? 1 : 0,
          }}
        />
        {loader.showOverlay && (
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
                    width: `${loader.keyframeProgress}%`,
                    height: "100%",
                    background: "#0f172a",
                    transition: "width 0.2s ease",
                  }}
                />
              </div>
              <span style={{ fontSize: 12, color: "#0f172a" }}>
                Loading {loader.keyframeProgress}%
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
}: ReducedMotionSequenceProps) {
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
    staticFrameIndex: resolvedEndIndex,
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
          src={frameSrc(resolvedEndIndex)}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            opacity: loader.isFrameReady ? 1 : 0,
          }}
        />
      )}
      {loader.showOverlay && (
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
            Loading {loader.keyframeProgress}%
          </span>
        </div>
      )}
    </div>
  );
}

export default function RecipeScrollSequence({
  progressRef,
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
      progressRef={progressRef}
      frameCount={frameCount}
      startIndex={startIndex}
      endIndex={endIndex}
      className={className}
    />
  );
}
