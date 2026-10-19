(function () {
  const marquee = document.querySelector(".marquee");
  if (!marquee) return;

  const inner = marquee.querySelector(".marquee__inner");
  const track = marquee.querySelector("[data-marquee-track]");
  if (!inner || !track) return;

  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");

  function build() {
    // Reduced motion: keep it static with a single item
    if (mql.matches) {
      inner.querySelectorAll(".marquee__track").forEach((t, i) => {
        if (i !== 0) t.remove();
      });
      [...track.children].forEach((n, i) => {
        if (i !== 0) n.remove();
      });
      return;
    }

    // Remove the cloned second lane if it exists
    inner.querySelectorAll(".marquee__track").forEach((t, i) => {
      if (i !== 0) t.remove();
    });

    // Reset the first lane to just the original item
    const originalItem = track.children[0];
    [...track.children].forEach((n, i) => {
      if (i !== 0) n.remove();
    });

    // Ensure enough items to cover the viewport (with buffer)
    const gap = parseFloat(getComputedStyle(track).gap) || 40;
    const itemWidth = originalItem.getBoundingClientRect().width || 0;
    const containerWidth = marquee.clientWidth || 0;
    if (!itemWidth || !containerWidth) return;

    const targetWidth = containerWidth * 1.5; // buffer so it never shows empty space
    const needed = Math.ceil(targetWidth / (itemWidth + gap));

    for (let i = 0; i < needed; i++) {
      track.appendChild(originalItem.cloneNode(true));
    }

    // Clone the entire lane once → two identical lanes
    inner.appendChild(track.cloneNode(true));
  }

  // Build after fonts load (width can change once fonts swap in)
  if (document.fonts?.ready) {
    document.fonts.ready.then(build).catch(build);
  } else {
    window.addEventListener("load", build, { once: true });
  }

  // Rebuild if the marquee width changes
  const ro = new ResizeObserver(build);
  ro.observe(marquee);

  mql.addEventListener?.("change", build);

  build();
})();
