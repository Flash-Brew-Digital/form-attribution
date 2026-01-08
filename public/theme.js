const THEME_STORAGE_KEY = "fa_sb_theme";

const getSystemTheme = () => {
  try {
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
};

const getStoredTheme = () => {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return raw === "dark" || raw === "light" ? raw : null;
  } catch {
    return null;
  }
};

const setStoredTheme = (theme) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore
  }
};

const applyHighlightTheme = (theme) => {
  const lightTheme = document.getElementById("hljs-theme-light");
  const darkTheme = document.getElementById("hljs-theme-dark");

  if (!(lightTheme && darkTheme)) {
    return;
  }

  const isDark = theme === "dark";
  lightTheme.disabled = isDark;
  darkTheme.disabled = !isDark;
};

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;

  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.checked = theme === "dark";
  }

  applyHighlightTheme(theme);
};

const animateThemeToggle = (theme) => {
  if (!window.gsap) {
    return;
  }

  const themeToggle = document.getElementById("theme-toggle");
  if (!themeToggle) {
    return;
  }

  const switchEl = themeToggle.closest(".switch");
  if (!switchEl) {
    return;
  }

  const thumb = switchEl.querySelector(".switch-theme-thumb");
  const sunIcon = switchEl.querySelector(".switch-theme-icon-sun");
  const moonIcon = switchEl.querySelector(".switch-theme-icon-moon");

  if (!(thumb && sunIcon && moonIcon)) {
    return;
  }

  const isDark = theme === "dark";
  const thumbBg = isDark ? "hsl(0, 0%, 98%)" : "hsl(240, 5.9%, 10%)";
  const sunColor = "hsl(0, 0%, 98%)";
  const moonColor = "hsl(240, 5.9%, 10%)";
  const inactiveColor = "hsl(240, 3.8%, 46.1%)";

  gsap.to(thumb, {
    x: isDark ? "100%" : "0%",
    backgroundColor: thumbBg,
    duration: 0.4,
    ease: "power2.inOut",
  });

  gsap.to(sunIcon, {
    opacity: isDark ? 0.5 : 1,
    color: isDark ? inactiveColor : sunColor,
    duration: 0.4,
  });

  gsap.to(moonIcon, {
    opacity: isDark ? 1 : 0.5,
    color: isDark ? moonColor : inactiveColor,
    duration: 0.4,
  });
};

const setInitialGsapState = (theme) => {
  if (!window.gsap) {
    return;
  }

  const themeToggle = document.getElementById("theme-toggle");
  if (!themeToggle) {
    return;
  }

  const switchEl = themeToggle.closest(".switch");
  if (!switchEl) {
    return;
  }

  const thumb = switchEl.querySelector(".switch-theme-thumb");
  const sunIcon = switchEl.querySelector(".switch-theme-icon-sun");
  const moonIcon = switchEl.querySelector(".switch-theme-icon-moon");

  if (!(thumb && sunIcon && moonIcon)) {
    return;
  }

  const isDark = theme === "dark";
  const thumbBg = isDark ? "hsl(0, 0%, 98%)" : "hsl(240, 5.9%, 10%)";
  const sunColor = "hsl(0, 0%, 98%)";
  const moonColor = "hsl(240, 5.9%, 10%)";
  const inactiveColor = "hsl(240, 3.8%, 46.1%)";

  gsap.set(thumb, {
    x: isDark ? "100%" : "0%",
    backgroundColor: thumbBg,
  });

  gsap.set(sunIcon, {
    opacity: isDark ? 0.5 : 1,
    color: isDark ? inactiveColor : sunColor,
  });

  gsap.set(moonIcon, {
    opacity: isDark ? 1 : 0.5,
    color: isDark ? moonColor : inactiveColor,
  });
};

const initTheme = () => {
  const stored = getStoredTheme();
  const initial = stored || getSystemTheme();

  applyTheme(initial);
  setInitialGsapState(initial);

  if (window.hljs && typeof window.hljs.highlightAll === "function") {
    window.hljs.highlightAll();
  }

  const themeToggle = document.getElementById("theme-toggle");
  themeToggle?.addEventListener("change", (e) => {
    const next = e.target.checked ? "dark" : "light";
    setStoredTheme(next);
    applyTheme(next);
    animateThemeToggle(next);
  });

  if (stored) {
    return;
  }

  try {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (getStoredTheme()) {
        return;
      }
      const next = mql.matches ? "dark" : "light";
      applyTheme(next);
      animateThemeToggle(next);
    };

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handler);
    } else if (typeof mql.addListener === "function") {
      mql.addListener(handler);
    }
  } catch {
    // ignore
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTheme, { once: true });
} else {
  initTheme();
}
