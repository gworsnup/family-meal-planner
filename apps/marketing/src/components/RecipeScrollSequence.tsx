"use client";

/**
 * Tweak checklist:
 * - Scroll height: update SCROLL_HEIGHT_VH
 * - Frame count: update FRAME_COUNT
 * - Frame path pattern: update frameSrc()
 * - Background color: adjust LOADER_BG or parent section styles
 */
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

const SCROLL_HEIGHT_VH = 300;
const FRAME_COUNT = 192;
const LAST_FRAME_INDEX = FRAME_COUNT - 1;
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

function useFramePreload({ reducedMotion }: { reducedMotion: boolean }) {
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
      setLoader((prev) => ({
        progress,
        isReady: prev.isReady || loaded > 0,
      }));
    };

    if (reducedMotion) {
      const img = new Image();
      img.src = frameSrc(LAST_FRAME_INDEX);
      img.onload = () => {
        if (!isMounted) return;
        imagesRef.current = [img];
        setLoader({ progress: 100, isReady: true });
      };
      img.onerror = () => {
        if (!isMounted) return;
        imagesRef.current = [img];
        setLoader({ progress: 100, isReady: true });
      };
      return () => {
        isMounted = false;
      };
    }

    let loadedCount = 0;
    imagesRef.current = new Array(FRAME_COUNT);

    const handleLoad = (index: number, image: HTMLImageElement) => {
      loadedCount += 1;
      if (!isMounted) return;
      imagesRef.current[index] = image;
      updateProgress(loadedCount, FRAME_COUNT);
    };

    for (let i = 0; i < FRAME_COUNT; i += 1) {
      const img = new Image();
      img.src = frameSrc(i);
      img.onload = () => handleLoad(i, img);
      img.onerror = () => handleLoad(i, img);
    }

    return () => {
      isMounted = false;
    };
  }, [reducedMotion]);

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

function AnimatedSequence() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const currentFrameRef = useRef(0);
  const { imagesRef, loader } = useFramePreload({ reducedMotion: false });

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
  });

  const frameIndex = useTransform(smoothProgress, [0, 1], [0, LAST_FRAME_INDEX]);
  const indicatorOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const image = imagesRef.current[currentFrameRef.current];
    if (image) {
      drawContain(canvas, image, dpr);
    }
  };

  const scheduleDraw = (index: number) => {
    const canvas = canvasRef.current;
    const image = imagesRef.current[index];
    if (!canvas || !image) return;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      const dpr = window.devicePixelRatio || 1;
      drawContain(canvas, image, dpr);
    });
  };

  useEffect(() => {
    if (!loader.isReady) return;
    const initialImage = imagesRef.current[0];
    if (initialImage && canvasRef.current) {
      currentFrameRef.current = 0;
      scheduleDraw(0);
    }
  }, [loader.isReady, imagesRef]);

  useEffect(() => {
    if (!loader.isReady) return;
    const unsubscribe = frameIndex.on("change", (latest) => {
      const nextIndex = Math.min(
        LAST_FRAME_INDEX,
        Math.max(0, Math.round(latest)),
      );
      if (!imagesRef.current[nextIndex]) return;
      currentFrameRef.current = nextIndex;
      scheduleDraw(nextIndex);
    });

    return () => {
      unsubscribe();
    };
  }, [frameIndex, imagesRef, loader.isReady]);

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
      ref={wrapperRef}
      style={{ height: `${SCROLL_HEIGHT_VH}vh` }}
      aria-hidden="true"
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          width: "100%",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
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
        <motion.div
          style={{
            opacity: indicatorOpacity,
            position: "absolute",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 12,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#111827",
            pointerEvents: "none",
          }}
        >
          Scroll
        </motion.div>
      </div>
    </div>
  );
}

function ReducedMotionSequence() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { imagesRef, loader } = useFramePreload({ reducedMotion: true });
  const image = imagesRef.current[0];

  return (
    <div
      ref={wrapperRef}
      style={{ height: `${SCROLL_HEIGHT_VH}vh` }}
      aria-hidden="true"
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          width: "100%",
        }}
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
            src={frameSrc(LAST_FRAME_INDEX)}
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
    </div>
  );
}

export default function RecipeScrollSequence() {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <ReducedMotionSequence />;
  }

  return <AnimatedSequence />;
}
