// Site-wide behavior for rebuilt pages: the full-screen phone menu and the footer school year.

// --- Phone menu ---
// The menu is a <dialog id="site-menu">. showModal() is built into the browser: it shows
// the dialog on top of the page, keeps keyboard focus inside it, and closes it when
// Escape is pressed.
const menu = document.getElementById("site-menu");

if (menu) {
  let opener = null; // the Menu button that opened it, so focus can go back there

  for (const button of document.querySelectorAll("[data-menu-open]")) {
    button.addEventListener("click", () => {
      opener = button;
      menu.showModal();
      menu.focus(); // focus the menu itself, so no link inside starts out outlined
    });
  }
  // Close the menu. Keyboard users get focus put back on the Menu button so they
  // don't lose their place; after a tap or click we don't, so no outline appears.
  const closeMenu = (usedKeyboard) => {
    menu.close();
    if (usedKeyboard) opener?.focus();
    else menu.blur();
  };

  for (const button of menu.querySelectorAll("[data-menu-close]")) {
    // event.detail counts clicks: 1+ for a finger or mouse, 0 when Enter/Space "clicked" it.
    button.addEventListener("click", (event) => closeMenu(event.detail === 0));
  }

  // Pressing Escape fires "cancel" on the dialog. Escape is always the keyboard.
  menu.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeMenu(true);
  });

  // The phone menu shouldn't stay open if the window grows to desktop width.
  window.matchMedia("(min-width: 48rem)").addEventListener("change", (event) => {
    if (event.matches && menu.open) menu.close();
  });
}

// --- Footer school year ---
// Swim seasons run across New Year, so the label follows the school year,
// which starts in August: Oct 2026 → "2026–2027", Feb 2027 → "2026–2027".
const today = new Date();
const startYear = today.getMonth() >= 7 ? today.getFullYear() : today.getFullYear() - 1; // getMonth(): 0 = Jan, 7 = Aug
for (const element of document.querySelectorAll("[data-current-season]")) {
  element.textContent = `${startYear}–${startYear + 1}`;
}
