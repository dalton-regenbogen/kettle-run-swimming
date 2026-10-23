// The photo carousel in the home page hero.
//
// Expects:
//   [data-carousel]                 the carousel (its photos fade between each other)
//     [data-slide]                  each photo (the first one starts visible)
//     [data-carousel-prev], [data-carousel-next]   arrow buttons (tablets and up; hidden on phones)
//     [data-carousel-pause]         the pause / play button
//     [data-carousel-dots]          where the dot buttons go (one per photo)
//
// On phones there are no arrows: tap a dot, or swipe left/right.
//
// Accessibility:
//   - It moves by itself every 6 seconds, so it needs a Pause button: accessibility guidelines (WCAG)
//     say anything that moves on its own for more than 5 seconds must be pausable. Arrows are optional.
//   - It doesn't move by itself when the visitor's device asks for reduced motion.
//   - It pauses while the mouse is over it or keyboard focus is inside it.
//   - Hidden photos get aria-hidden="true", so screen readers only describe the one showing.

const carousel = document.querySelector("[data-carousel]");

if (carousel) {
  const slides = [...carousel.querySelectorAll("[data-slide]")];
  const dotsWrap = carousel.querySelector("[data-carousel-dots]");
  const pauseButton = carousel.querySelector("[data-carousel-pause]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let current = 0;
  let timer = null;
  let paused = reducedMotion; // the visitor's choice (Pause button or reduced motion)

  const dots = slides.map((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    // A small 6px dot; after:-inset-1.5 adds an invisible area around it so it's easier to tap.
    dot.className = "relative size-1.5 rounded-full bg-white/40 transition-colors after:absolute after:-inset-1.5 hover:bg-white/70 aria-[current=true]:bg-white";
    dot.setAttribute("aria-label", `Show photo ${index + 1} of ${slides.length}`);
    dot.addEventListener("click", () => show(index));
    dotsWrap.append(dot);
    return dot;
  });

  function show(index) {
    current = (index + slides.length) % slides.length; // wraps around at both ends
    slides.forEach((slide, i) => {
      slide.classList.toggle("opacity-0", i !== current);
      slide.setAttribute("aria-hidden", String(i !== current));
    });
    dots.forEach((dot, i) => (i === current ? dot.setAttribute("aria-current", "true") : dot.removeAttribute("aria-current")));
  }

  const stop = () => {
    clearInterval(timer);
    timer = null;
  };
  const start = () => {
    stop();
    if (!paused) timer = setInterval(() => show(current + 1), 6000);
  };

  function setPaused(value) {
    paused = value;
    pauseButton.setAttribute("aria-label", paused ? "Play slideshow" : "Pause slideshow");
    pauseButton.querySelector("[data-icon-pause]").hidden = paused;
    pauseButton.querySelector("[data-icon-play]").hidden = !paused;
    paused ? stop() : start();
  }

  pauseButton.addEventListener("click", () => setPaused(!paused));
  carousel.querySelector("[data-carousel-prev]")?.addEventListener("click", () => show(current - 1));
  carousel.querySelector("[data-carousel-next]")?.addEventListener("click", () => show(current + 1));

  // Swipe on touch screens: a mostly sideways drag of 40px or more goes to the next/previous photo.
  let touchX = null;
  let touchY = null;
  carousel.addEventListener("touchstart", (event) => {
    touchX = event.touches[0].clientX;
    touchY = event.touches[0].clientY;
  }, { passive: true }); // passive: we never block scrolling
  carousel.addEventListener("touchend", (event) => {
    if (touchX === null) return;
    const dx = event.changedTouches[0].clientX - touchX;
    const dy = event.changedTouches[0].clientY - touchY;
    touchX = null;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return; // a tap or an up/down scroll
    show(current + (dx < 0 ? 1 : -1)); // swipe left → next photo
    start(); // restart the 6-second timer
  });

  // Hold still while someone is looking at or using it.
  carousel.addEventListener("mouseenter", stop);
  carousel.addEventListener("mouseleave", start);
  carousel.addEventListener("focusin", stop);
  carousel.addEventListener("focusout", start);

  show(0);
  setPaused(paused);
}
