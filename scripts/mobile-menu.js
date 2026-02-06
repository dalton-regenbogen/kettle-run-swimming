const menuButton = document.getElementById("mobile-menu-button");
const iconHamburger = document.getElementById("icon-hamburger");
const iconClose = document.getElementById("icon-close");

const mobileMenu = document.getElementById("mobile-menu");

const panel = document.getElementById("mobile-menu-panel");

const dropdownButtons = document.querySelectorAll(
  "#mobile-menu [data-mobile-toggle]",
);

const prefersReduced = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);

function setMenuOpen(open) {
  if (!mobileMenu || !panel) return;

  mobileMenu.setAttribute("aria-hidden", open ? "false" : "true");
  mobileMenu.classList.toggle("pointer-events-none", !open);

  panel.classList.toggle("translate-x-full", !open);
  panel.classList.toggle("translate-x-0", open);

  iconHamburger?.classList.toggle("hidden", open);
  iconClose?.classList.toggle("hidden", !open);

  // ✅ lock background scrolling (kills most horizontal scroll too)
  document.body.classList.toggle("overflow-hidden", open);

  if (!open) closeAllSubmenus();
}

function closeAllSubmenus(exceptBtn = null) {
  dropdownButtons.forEach((btn) => {
    if (btn === exceptBtn) return;

    const submenu = btn.nextElementSibling;
    if (!submenu || submenu.tagName !== "UL") return;

    btn.setAttribute("aria-expanded", "false");
    rotateChevron(btn, false);
    collapseSubmenu(submenu);
  });
}

function rotateChevron(btn, expanded) {
  const chevron = btn.querySelector("[data-chevron]");
  if (!chevron) return;
  chevron.classList.toggle("rotate-180", expanded);
}

function expandSubmenu(submenu) {
  if (prefersReduced.matches) {
    submenu.classList.remove("opacity-0");
    submenu.classList.add("opacity-100");
    submenu.style.maxHeight = "none";
    return;
  }

  submenu.classList.remove("opacity-0");
  submenu.classList.add("opacity-100");

  // set to measured height for animation
  submenu.style.maxHeight = submenu.scrollHeight + "px";

  // after transition, allow it to grow naturally if content wraps/changes
  submenu.addEventListener(
    "transitionend",
    () => {
      if (submenu.classList.contains("opacity-100")) {
        submenu.style.maxHeight = "none";
      }
    },
    { once: true },
  );
}

function collapseSubmenu(submenu) {
  if (prefersReduced.matches) {
    submenu.classList.add("opacity-0");
    submenu.classList.remove("opacity-100");
    submenu.style.maxHeight = "0px";
    return;
  }

  // if it was "none", snap to current height first so it can animate closed
  if (submenu.style.maxHeight === "none") {
    submenu.style.maxHeight = submenu.scrollHeight + "px";
    // force reflow
    submenu.offsetHeight;
  }

  submenu.style.maxHeight = "0px";
  submenu.classList.add("opacity-0");
  submenu.classList.remove("opacity-100");
}

menuButton?.addEventListener("click", () => {
  const isOpen = mobileMenu?.getAttribute("aria-hidden") === "false";
  setMenuOpen(!isOpen);
});

// ESC to close
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setMenuOpen(false);
});

// Dropdown accordion w/ animation + chevrons
dropdownButtons.forEach((btn) => {
  const submenu = btn.nextElementSibling;
  if (!submenu || submenu.tagName !== "UL") return;

  // Ensure initial state matches classes
  const expanded = btn.getAttribute("aria-expanded") === "true";
  rotateChevron(btn, expanded);

  btn.addEventListener("click", () => {
    const isExpanded = btn.getAttribute("aria-expanded") === "true";
    const nextExpanded = !isExpanded;

    // accordion behavior
    closeAllSubmenus(btn);

    btn.setAttribute("aria-expanded", nextExpanded ? "true" : "false");
    rotateChevron(btn, nextExpanded);

    if (nextExpanded) {
      closeAllSubmenus(btn); // only close others when opening
      btn.setAttribute("aria-expanded", "true");
      rotateChevron(btn, true);
      expandSubmenu(submenu);
    } else {
      btn.setAttribute("aria-expanded", "false");
      rotateChevron(btn, false);
      collapseSubmenu(submenu);
    }
  });
});

// Start closed by default (keeps animations consistent)
setMenuOpen(false);