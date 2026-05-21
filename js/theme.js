// js/theme.js

export function initTheme(onToggle) {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
  document.body.classList.toggle('dark', isDark);
  if (themeToggleBtn) themeToggleBtn.textContent = isDark ? '☀️' : '🌙';

  themeToggleBtn.onclick = () => {
    const willBeDark = !document.body.classList.contains('dark');
    document.body.classList.toggle('dark', willBeDark);
    themeToggleBtn.textContent = willBeDark ? '☀️' : '🌙';
    localStorage.setItem('theme', willBeDark ? 'dark' : 'light');
    if (onToggle) onToggle();
  };
}
