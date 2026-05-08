// Hero entrance — native <video> playback, decoupled from scroll.
//
// We dropped scroll-scrubbing entirely. The hero video autoplays once on
// load (muted + playsinline so it works on iOS / Safari) and the headline
// text reveals at a fixed point in the video's timeline.
//
// Why <video> over the old canvas frame-sequence:
//   • Plays the FULL 8s clip natively at the video's own framerate — no
//     missing frames, no halfway stop.
//   • Forward playback (no seeking) is what video decoders are optimized
//     for. Native fps, no stutter, much lighter than 200+ JPGs.
//   • Browser handles preloading, decode pipelining, and frame pacing.
//
// Reduced-motion users get a static last-frame poster instead of the clip.

(function () {
  // Reveal text at this fraction of total video duration. The clip is ~8s
  // and the ingredients-flying portion settles in around the 60% mark.
  const TEXT_REVEAL_AT = 0.62;
  // Fade the darkening overlay in slightly before the text so the headline
  // has a readable backdrop the moment it appears.
  const OVERLAY_FADE_AT = 0.5;

  const hero = document.getElementById('hero');
  const video = document.getElementById('hero-video');
  const titleEl = document.querySelector('.hero-title');
  const textEl = document.querySelector('.hero-text');
  const chromeEl = document.querySelector('.hero-chrome');
  const overlayEl = document.querySelector('.hero-overlay');
  const cueEl = document.querySelector('.hero-scroll-cue');
  if (!hero || !video) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reveal title + sub + CTA buttons.
  let textRevealed = false;
  function revealText() {
    if (textRevealed) return;
    textRevealed = true;
    titleEl && titleEl.classList.add('in');
    textEl && textEl.classList.add('in');
    if (chromeEl) chromeEl.style.setProperty('--hero-chrome-op', '0');
  }

  let overlayShown = false;
  function showOverlay() {
    if (overlayShown) return;
    overlayShown = true;
    overlayEl && overlayEl.classList.add('in');
  }

  if (reduced) {
    // Skip the clip entirely — pause on the last frame and reveal text.
    video.autoplay = false;
    video.addEventListener('loadedmetadata', () => {
      try { video.currentTime = video.duration - 0.05; } catch (e) {}
      video.pause();
      showOverlay();
      revealText();
    }, { once: true });
  } else {
    // Drive the chrome fade + text reveal off video time.
    video.addEventListener('timeupdate', () => {
      if (!video.duration) return;
      const t = video.currentTime / video.duration;

      // Cross-fade the eyebrow pill out as the clip progresses, since the
      // headline is about to claim the visual focus.
      if (chromeEl) {
        chromeEl.style.setProperty('--hero-chrome-op', String(Math.max(0, 1 - t * 1.6)));
      }

      if (!overlayShown && t >= OVERLAY_FADE_AT) showOverlay();
      if (!textRevealed && t >= TEXT_REVEAL_AT) revealText();
    });

    // Belt-and-braces: if for any reason the timeupdate threshold never
    // fires (autoplay blocked, slow decode, etc.), still reveal text on end.
    video.addEventListener('ended', revealText);

    // If autoplay is blocked (rare with muted+playsinline, but possible),
    // reveal the headline on a short delay so the hero never sits silent.
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        setTimeout(() => { showOverlay(); revealText(); }, 1200);
      });
    }
  }

  // Fade the scroll cue once the user actually starts scrolling.
  if (cueEl) {
    cueEl.style.transition = 'opacity 0.4s ease';
    let cueHidden = false;
    window.addEventListener('scroll', () => {
      if (cueHidden) return;
      if (window.scrollY > 40) {
        cueEl.style.opacity = '0';
        cueHidden = true;
      }
    }, { passive: true });
  }
})();
