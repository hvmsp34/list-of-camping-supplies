// js/theme.js

export function initTheme(onToggle) {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
  document.body.classList.toggle('dark', isDark);
  if (toggleBtn) toggleBtn.textContent = isDark ? '☀️' : '🌙';

  toggleBtn?.addEventListener('click', () => {
    const willBeDark = !document.body.classList.contains('dark');
    document.body.classList.toggle('dark', willBeDark);
    toggleBtn.textContent = willBeDark ? '☀️' : '🌙';
    localStorage.setItem('theme', willBeDark ? 'dark' : 'light');
    if (onToggle) onToggle();
  });
}
