declare module "canvas-confetti" {
  type ConfettiOrigin = {
    x?: number;
    y?: number;
  };

  type ConfettiOptions = {
    particleCount?: number;
    spread?: number;
    origin?: ConfettiOrigin;
  };

  type Confetti = (options?: ConfettiOptions) => Promise<null> | null;

  const confetti: Confetti;
  export default confetti;
}
