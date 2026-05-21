import { CATEGORIES } from './categories.js';

let currentLang = 'ru';
let packedItems = JSON.parse(localStorage.getItem('packedCampingItems')) || [];
// Хранилище для предметов, добавленных пользователем
let customItems = JSON.parse(localStorage.getItem('customCampingItems')) || { aptechka: [], byt: [], odezhda: [] };
let globalTranslations = null;
const SUPPORTED_LANGS = ['ru', 'en', 'de', 'es', 'fr'];

// ========== ГЕНЕРАТОР ЗВУКОВ ==========
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  if (type === 'click') {
    osc.type = 'sine'; osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start(); osc.stop(audioCtx.currentTime + 0.1);
  } else if (type === 'fanfare') {
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination); o.type = 'triangle';
      const start = audioCtx.currentTime + i * 0.12; o.frequency.setValueAtTime(freq, start);
      g.gain.setValueAtTime(0, audioCtx.currentTime); g.gain.setValueAtTime(0.15, start);
      g.gain.exponentialRampToValueAtTime(0.01, start + 0.4); o.start(start); o.stop(start + 0.4);
    });
  }
}

// ========== СИСТЕМА КОНФЕТТИ ==========
function startConfetti() {
  const canvas = document.getElementById('confettiCanvas'); if (!canvas) return;
  const ctx = canvas.getContext('2d'); canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const colors = ['#f56565', '#ed8936', '#ecc94b', '#48bb78', '#38b2ac', '#4299e1', '#9f7aea']; const particles = [];
  for (let i = 0; i < 150; i++) {
    particles.push({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 4, d: Math.random() * canvas.height, color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5, tiltAngleIncremental: Math.random() * 0.07 + 0.02, tiltAngle: 0
    });
  }
  let animId; const start = Date.now();
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, idx) => {
      p.tiltAngle += p.tiltAngleIncremental; p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2; p.x += Math.sin(p.tiltAngle);
      p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15; ctx.beginPath(); ctx.lineWidth = p.r; ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 2, p.y); ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2); ctx.stroke();
    });
    if (Date.now() - start < 4000) animId = requestAnimationFrame(draw);
    else { ctx.clearRect(0, 0, canvas.width, canvas.height); cancelAnimationFrame(animId); }
  }
  draw();
}

// ========== СИСТЕМА ТЕМЫ ОФОРМЛЕНИЯ ==========
function initTheme() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const savedTheme = localStorage.getItem('theme');
  // Проверяем системную тему, если пользователь еще не делал выбор вручную
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
  document.body.classList.toggle('dark', isDark);
  if (toggleBtn) toggleBtn.textContent = isDark ? '☀️' : '🌙';

  toggleBtn?.addEventListener('click', () => {
    const willBeDark = !document.body.classList.contains('dark');
    document.body.classList.toggle('dark', willBeDark);
    toggleBtn.textContent = willBeDark ? '☀️' : '🌙';
    localStorage.setItem('theme', willBeDark ? 'dark' : 'light');
    playSound('click');
  });
}

// ========== РЕНДЕР И ЛОКАЛИЗАЦИЯ ==========
async function loadTranslations(lang) {
  try {
    const response = await fetch(`./locales/${lang}.json`);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    globalTranslations = await response.json(); return globalTranslations;
  } catch (error) {
    if (lang !== 'ru') return loadTranslations('ru');
    throw error;
  }
}

function createCardElement(id, emoji, name, index) {
  const card = document.createElement('div'); card.className = 'item-card'; card.dataset.itemId = id;
  const emojiEl = document.createElement('div'); emojiEl.className = 'item-emoji'; emojiEl.textContent = emoji;
  const nameEl = document.createElement('div'); nameEl.className = 'item-name'; nameEl.textContent = name;
  const numEl = document.createElement('div'); numEl.className = 'item-number'; numEl.textContent = index + 1;
  card.append(emojiEl, nameEl, numEl); return card;
}

function renderGrids(translations) {
  const packedContainer = document.getElementById('packedContainer');
  const packedFragment = document.createDocumentFragment();
  let packedCounter = 0; let totalVisibleCount = 0; let totalItemsCount = 0;

  Object.entries(CATEGORIES).forEach(([catKey, category]) => {
    const container = document.getElementById(category.containerId); if (!container) return;
    const mainFragment = document.createDocumentFragment(); let visibleCount = 0;

    // Объединяем встроенные предметы с созданными пользователем
    const allItems = [...category.items, ...(customItems[catKey] || [])];

    allItems.forEach(({ id, emoji }, idx) => {
      totalItemsCount++;
      // Если у предмета нет перевода (потому что его ввели вручную), выводим его исходный id в качестве имени
      const name = translations.items?.[id] || id;
      const isPacked = packedItems.includes(id);
      const card = createCardElement(id, emoji, name, idx);

      if (isPacked) { packedFragment.appendChild(card); packedCounter++; }
      else { mainFragment.appendChild(card); visibleCount++; totalVisibleCount++; }
    });

    container.replaceChildren(mainFragment);
    const countEl = document.getElementById(`${catKey}Count`);
    if (countEl) countEl.textContent = `${visibleCount} ${translations.itemsCount || 'предметов'}`;
  });

  if (packedContainer) packedContainer.replaceChildren(packedFragment);
  const packedCountEl = document.getElementById('packedCount'); if (packedCountEl) packedCountEl.textContent = packedCounter;

  const progressPercent = totalItemsCount > 0 ? Math.round((packedCounter / totalItemsCount) * 100) : 0;
  const progressBar = document.getElementById('progressBar'); const progressPercentText = document.getElementById('progressPercent');
  if (progressBar) progressBar.style.width = `${progressPercent}%`; if (progressPercentText) progressPercentText.textContent = `${progressPercent}%`;

  const successBanner = document.getElementById('successMessage');
  if (successBanner) {
    if (totalVisibleCount === 0 && packedCounter > 0) {
      if (successBanner.classList.contains('hidden')) { successBanner.classList.remove('hidden'); playSound('fanfare'); startConfetti(); }
    } else { successBanner.classList.add('hidden'); }
  }
  updateToggleButtonText(packedContainer?.classList.contains('hidden'));
}

function updateToggleButtonText(isHidden) {
  const toggleTextEl = document.getElementById('togglePackedText'); if (!toggleTextEl || !globalTranslations) return;
  const key = isHidden ? 'showPacked' : 'hidePacked';
  toggleTextEl.textContent = globalTranslations[key] || (isHidden ? 'Показать' : 'Скрыть');
}

async function renderUI(lang) {
  try {
    const translations = await loadTranslations(lang);
    currentLang = lang;
    localStorage.setItem('preferredLanguage', lang);

    // Перевод обычного текста
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (translations[key]) el.textContent = translations[key];
    });

    // ИСПРАВЛЕНО: Перевод плейсхолдеров в инпутах (i18n-holder превращается в i18nHolder)
    document.querySelectorAll('[data-i18n-holder]').forEach(el => {
      const key = el.dataset.i18nHolder;
      if (translations[key]) el.placeholder = translations[key];
    });

    renderGrids(translations);
    updateActiveButton(lang);
  } catch (error) {
    console.error('Render failed:', error);
  }
}


function updateActiveButton(activeLang) {
  document.querySelectorAll('[data-lang]').forEach(btn => { btn.classList.toggle('active', btn.dataset.lang === activeLang); });
}

// ========== ИНИЦИАЛИЗАЦИЯ СОБЫТИЙ ==========
function initEvents() {
  document.getElementById('langControls')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-lang]'); if (!btn || btn.dataset.lang === currentLang) return;
    document.body.style.opacity = '0.5'; await renderUI(btn.dataset.lang); document.body.style.opacity = '1';
  });

  document.body.addEventListener('click', (e) => {
    const card = e.target.closest('.item-card'); if (!card) return;
    const itemId = card.dataset.itemId; const isPacked = packedItems.includes(itemId);
    playSound('click'); card.style.opacity = '0'; card.style.transform = 'scale(0.9)';
    setTimeout(() => {
      if (isPacked) packedItems = packedItems.filter(id => id !== itemId);
      else packedItems.push(itemId);
      localStorage.setItem('packedCampingItems', JSON.stringify(packedItems)); renderGrids(globalTranslations);
    }, 200);
  });

  // Событие добавления пользовательского предмета
  document.querySelectorAll('.add-item-form').forEach(form => {
    const input = form.querySelector('input');
    const button = form.querySelector('button');
    const categoryKey = form.dataset.category;

    const handleAdd = () => {
      const val = input.value.trim();
      if (!val) return;

      // Создаем объект кастомного предмета. В качестве ID используем введенный пользователем текст
      customItems[categoryKey].push({ id: val, emoji: '🎒' });
      localStorage.setItem('customCampingItems', JSON.stringify(customItems));

      input.value = '';
      playSound('click');
      renderGrids(globalTranslations);
    };

    button?.addEventListener('click', handleAdd);
    input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleAdd(); });
  });

  const toggleBtn = document.getElementById('togglePackedBtn'); const packedContainer = document.getElementById('packedContainer');
  toggleBtn?.addEventListener('click', () => { if (!packedContainer) return; packedContainer.classList.toggle('hidden'); updateToggleButtonText(packedContainer.classList.contains('hidden')); });

  document.getElementById('resetBtn')?.addEventListener('click', () => {
    if (packedItems.length === 0 && Object.values(customItems).flat().length === 0) return;
    if (!confirm(globalTranslations?.confirmReset || 'Сбросить прогресс?')) return;
    playSound('click');
    packedItems = []; customItems = { aptechka: [], byt: [], odezhda: [] };
    localStorage.removeItem('packedCampingItems'); localStorage.removeItem('customCampingItems');
    packedContainer?.classList.add('hidden'); renderGrids(globalTranslations);
  });
}

async function init() {
  const saved = localStorage.getItem('preferredLanguage'); const navLang = navigator.language?.substring(0, 2);
  const startLang = SUPPORTED_LANGS.includes(saved) ? saved : (SUPPORTED_LANGS.includes(navLang) ? navLang : 'ru');
  initTheme(); initEvents();
  const packedContainer = document.getElementById('packedContainer');
  if (packedContainer && packedItems.length > 0) packedContainer.classList.remove('hidden');
  await renderUI(startLang);
}

init().catch(console.error);
