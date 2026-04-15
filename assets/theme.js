// assets/theme.js — Gestion de tema claro/oscuro por usuario

const THEME_KEY_PREFIX = 'presales_ar_theme_';

function getThemeKey() {
  try {
    const raw = sessionStorage.getItem('presales_ar_session');
    const session = raw ? JSON.parse(raw) : null;
    return THEME_KEY_PREFIX + (session ? session.usuario : 'default');
  } catch { return THEME_KEY_PREFIX + 'default'; }
}

function getSavedTheme() {
  return localStorage.getItem(getThemeKey()) || 'light';
}

function applyTheme(theme) {
  const body = document.body;
  if (!body) return;
  body.classList.toggle('dark-mode', theme === 'dark');
}

function saveTheme(theme) {
  localStorage.setItem(getThemeKey(), theme);
  applyTheme(theme);
}

function toggleTheme() {
  saveTheme(getSavedTheme() === 'dark' ? 'light' : 'dark');
}

function initTheme() {
  if (document.body) {
    applyTheme(getSavedTheme());
  } else {
    document.addEventListener('DOMContentLoaded', () => applyTheme(getSavedTheme()));
  }
}

initTheme();

window.THEME = { getSavedTheme, applyTheme, saveTheme, toggleTheme, initTheme };
