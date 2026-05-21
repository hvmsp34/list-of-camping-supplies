import { CAMPING_ITEMS, CATEGORIES } from './categories.js';
import { ITEM_EMOJIS } from './emojis.js';

// Состояние приложения
let currentLang = 'ru';
let currentTranslations = null;
let isLoading = false;

// DOM элементы
const DOM = {
  mainTitle: document.getElementById('main-title'),
  subTitle: document.getElementById('sub-title'),
  catAptechka: document.getElementById('cat-aptechka'),
  catByt: document.getElementById('cat-byt'),
  catOdezhda: document.getElementById('cat-odezhda'),
  footerText: document.getElementById('footer'),
  aptechkaCount: document.getElementById('aptechka-count'),
  bytCount: document.getElementById('byt-count'),
  odezhdaCount: document.getElementById('odezhda-count'),
  langControls: document.getElementById('lang-controls')
};

// Вспомогательные функции
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showLoadingState(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '<div class="loading-spinner">Загрузка...</div>';
  }
}

// Загрузка локализации
async function loadTranslations(lang) {
  try {
    const response = await fetch(`./locales/${lang}.json`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const translations = await response.json();
    return translations;
  } catch (error) {
    console.error(`Failed to load ${lang} translations:`, error);
    // Fallback на русский
    if (lang !== 'ru') {
      console.log('Loading fallback Russian translations...');
      return loadTranslations('ru');
    }
    throw error;
  }
}

// Построение сетки
function buildGrid(category, translations) {
  const container = document.getElementById(category.containerId);
  if (!container) {
    console.warn(`Container ${category.containerId} not found`);
    return;
  }

  const fragment = document.createDocumentFragment();

  category.itemIndices.forEach((index, idx) => {
    const itemName = CAMPING_ITEMS[index];
    const translatedName = translations.items[itemName] || itemName;
    const emoji = ITEM_EMOJIS[itemName] || '📦';

    const card = document.createElement('div');
    card.className = 'item-card';
    card.setAttribute('data-item-id', itemName);
    card.setAttribute('data-item-index', index);

    card.innerHTML = `
      <div class="item-emoji">${emoji}</div>
      <div class="item-name">${escapeHtml(translatedName)}</div>
      <div class="item-number">${idx + 1}</div>
    `;

    fragment.appendChild(card);
  });

  container.innerHTML = '';
  container.appendChild(fragment);
}

// Рендер всего интерфейса
async function renderUI(lang) {
  if (isLoading) return;

  isLoading = true;

  // Показываем индикаторы загрузки
  Object.values(CATEGORIES).forEach(cat => {
    showLoadingState(cat.containerId);
  });

  try {
    const translations = await loadTranslations(lang);
    currentTranslations = translations;

    // Обновляем текстовые элементы
    const textMapping = {
      mainTitle: translations.mainTitle,
      subTitle: translations.subTitle,
      catAptechka: translations.catAptechka,
      catByt: translations.catByt,
      catOdezhda: translations.catOdezhda,
      footerText: translations.footer,
      aptechkaCount: translations.aptechkaCount,
      bytCount: translations.bytCount,
      odezhdaCount: translations.odezhdaCount
    };

    Object.entries(textMapping).forEach(([key, value]) => {
      if (DOM[key]) DOM[key].innerText = value;
    });

    // Рендерим сетки
    Object.values(CATEGORIES).forEach(category => {
      buildGrid(category, translations);
    });

    // Сохраняем выбранный язык
    localStorage.setItem('preferredLanguage', lang);
    currentLang = lang;

  } catch (error) {
    console.error('Failed to render UI:', error);
    // Показываем сообщение об ошибке пользователю
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = 'Failed to load translations. Please refresh the page.';
    document.body.prepend(errorDiv);
  } finally {
    isLoading = false;
  }
}

// Определение языка браузера
function getBrowserLang() {
  const supportedLangs = ['ru', 'en', 'de', 'es', 'fr'];
  const savedLang = localStorage.getItem('preferredLanguage');

  if (savedLang && supportedLangs.includes(savedLang)) {
    return savedLang;
  }

  const navLang = (navigator.language || navigator.userLanguage || 'ru').substring(0, 2);
  return supportedLangs.includes(navLang) ? navLang : 'ru';
}

// Инициализация кнопок переключения языка
function initLanguageButtons() {
  if (!DOM.langControls) {
    console.error('Language controls container not found');
    return;
  }

  const buttons = DOM.langControls.querySelectorAll('button');

  const updateActiveButton = (activeLang) => {
    buttons.forEach(btn => {
      const isActive = btn.getAttribute('data-lang') === activeLang;
      btn.classList.toggle('active', isActive);
    });
  };

  buttons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const lang = btn.getAttribute('data-lang');
      if (lang === currentLang || isLoading) return;

      // Анимируем смену языка
      document.body.style.opacity = '0.5';
      await renderUI(lang);
      document.body.style.opacity = '1';
      updateActiveButton(lang);
    });
  });

  updateActiveButton(currentLang);
}

// Проверка наличия всех необходимых DOM элементов
function checkRequiredElements() {
  const required = Object.values(DOM);
  const missing = required.filter(el => !el);

  if (missing.length) {
    console.error('Missing required DOM elements:', missing);
    return false;
  }
  return true;
}

// Инициализация приложения
async function init() {
  if (!checkRequiredElements()) {
    console.error('Cannot initialize app - missing DOM elements');
    return;
  }

  currentLang = getBrowserLang();
  await renderUI(currentLang);
  initLanguageButtons();

  // Сохраняем язык при закрытии
  window.addEventListener('beforeunload', () => {
    localStorage.setItem('preferredLanguage', currentLang);
  });
}

// Запуск приложения
init().catch(console.error);