(() => {
  const slides = Array.from(document.querySelectorAll("#hero-carousel [data-slide]"));
  const dotsWrap = document.getElementById("hero-dots");
  const prevBtn = document.querySelector("[data-hero-prev]");
  const nextBtn = document.querySelector("[data-hero-next]");

  if (!slides.length || !dotsWrap || !prevBtn || !nextBtn) return;

  let i = 0;
  let timer = null;

  const makeDot = (idx) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className =
      "h-2.5 w-2.5 rounded-full border border-white/40 bg-white/20 hover:bg-white/35 transition";
    b.setAttribute("aria-label", `Show image ${idx + 1}`);
    b.addEventListener("click", () => go(idx, true));
    return b;
  };

  const dots = slides.map((_, idx) => {
    const d = makeDot(idx);
    dotsWrap.appendChild(d);
    return d;
  });

  const render = () => {
    slides.forEach((s, idx) => {
      s.classList.toggle("opacity-100", idx === i);
      s.classList.toggle("opacity-0", idx !== i);
    });
    dots.forEach((d, idx) => {
      d.classList.toggle("bg-white", idx === i);
      d.classList.toggle("bg-white/20", idx !== i);
    });
  };

  const go = (next, reset) => {
    i = (next + slides.length) % slides.length;
    render();
    if (reset) start();
  };

  const start = () => {
    stop();
    timer = window.setInterval(() => go(i + 1, false), 5500);
  };

  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = null;
  };

  prevBtn.addEventListener("click", () => go(i - 1, true));
  nextBtn.addEventListener("click", () => go(i + 1, true));

  // pause on hover/focus
  const hero = document.getElementById("hero-carousel");
  hero?.addEventListener("mouseenter", stop);
  hero?.addEventListener("mouseleave", start);
  hero?.addEventListener("focusin", stop);
  hero?.addEventListener("focusout", start);

  render();
  start();
})

();