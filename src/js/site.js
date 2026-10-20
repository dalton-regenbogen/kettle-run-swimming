// Site-wide behavior for rebuilt pages: the phone menu and the footer year.

// --- Phone menu ---
// Each menu button names the menu it controls with aria-controls="menu-id".
// aria-expanded="true"/"false" tells screen readers (and our CSS) whether it's open.
const desktopWidth = window.matchMedia("(min-width: 48rem)");

for (const button of document.querySelectorAll("[data-menu-button]")) {
  const menu = document.getElementById(button.getAttribute("aria-controls"));
  if (!menu) continue;

  const isOpen = () => button.getAttribute("aria-expanded") === "true";
  const setOpen = (open) => {
    button.setAttribute("aria-expanded", String(open));
    menu.hidden = !open; // the hidden attribute removes it from view and from keyboard focus
  };

  button.addEventListener("click", () => setOpen(!isOpen()));

  // Escape closes the menu and puts focus back on the button.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen()) {
      setOpen(false);
      button.focus();
    }
  });

  // The phone menu shouldn't stay open if the window grows to desktop width.
  desktopWidth.addEventListener("change", () => setOpen(false));
}

// --- Footer year ---
for (const element of document.querySelectorAll("[data-current-year]")) {
  element.textContent = new Date().getFullYear();
}
