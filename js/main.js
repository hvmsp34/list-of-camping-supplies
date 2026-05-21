// js/main.js

import { CATEGORIES } from './categories.js';
import { playSound } from './audio.js';
import { startConfetti } from './confetti.js';
import { initTheme } from './theme.js';
import { state, loadTranslations, saveState, resetState, SUPPORTED_LANGS } from './state.js';
import { createCardElement, updateI18nElements } from './dom.js';

function deleteCustomItem(id) {
  playSound('click');
  Object.keys(state.customItems).forEach(catKey => {
    state.customItems[catKey] = state.customItems[catKey].filter(item => item.id !== id);
  });
  state.packedItems = state.packedItems.filter(pId => pId !== id);
  saveState();
  renderGrids();
}

function renderGrids() {
  const packedFragment = document.createDocumentFragment();
  let packedCounter = 0, totalVisibleCount = 0, totalItemsCount = 0;

  Object.entries(CATEGORIES).forEach(([catKey, category]) => {
    const container = category.containerId;
    if (!container) return;

    const mainFragment = document.createDocumentFragment();
    let visibleCount = 0;

    // УСТРАНЕНО ДУБЛИРОВАНИЕ: Объединяем дефолтные и кастомные предметы в один плоский список с флагом типа
    const defaultItems = (category.items || []).map(item => ({ ...item, isCustom: false }));
    const customItemsList = (state.customItems[catKey] || []).map(item => ({ ...item, isCustom: true }));
    const allCombinedItems = [...defaultItems, ...customItemsList];

    allCombinedItems.forEach((item, idx) => {
      if (!item?.id) return;
      totalItemsCount++;

      const { id, isCustom, emoji = (isCustom ? '🎒' : '📦') } = item;
      const name = (!isCustom && state.translations?.items?.[id]) ? state.translations.items[id] : id;
      const isPacked = state.packedItems.includes(id);

      const card = createCardElement(id, emoji, name, idx, isCustom, deleteCustomItem);

      if (isPacked) {
        packedFragment.appendChild(card);
        packedCounter++;
      } else {
        mainFragment.appendChild(card);
        visibleCount++;
        totalVisibleCount++;
      }
    });

    container.replaceChildren(mainFragment);

    const countEl = document.getElementById(`${catKey}Count`);
    if (countEl) {
      countEl.textContent = `${visibleCount} ${state.translations?.itemsCount || 'предметов'}`;
    }
  });

  packedContainer.replaceChildren(packedFragment);
  packedCount.textContent = packedCounter;

  // Обновление прогресс-бара и баннера успеха
  updateProgressAndBanners(packedCounter, totalItemsCount, totalVisibleCount);
}

function updateProgressAndBanners(packedCounter, totalItemsCount, totalVisibleCount) {
  const progressPercentText = totalItemsCount > 0 ? Math.round((packedCounter / totalItemsCount) * 100) : 0;

  console.log(progressPercentText);
  progressBar.style.width = progressPercentText + '%';
  progressPercent.textContent = progressPercentText + '%';

  if (progressPercentText === 100) {
    successMessage.classList.remove('hidden');
    playSound('fanfare');
    startConfetti();
  } else {
    successMessage.classList.add('hidden');
  }

  // Обновление текста кнопки
  const isHidden = packedContainer?.classList.contains('hidden');
  const toggleTextEl = document.getElementById('togglePackedText');
  if (toggleTextEl && state.translations) {
    toggleTextEl.textContent = state.translations[isHidden ? 'showPacked' : 'hidePacked'] || '';
  }
}

async function renderUI(lang) {
  try {
    const translations = await loadTranslations(lang);
    updateI18nElements(translations);
    renderGrids();

    document.querySelectorAll('[data-lang]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  } catch (error) {
    console.error('Render failed:', error);
  }
}

function initEvents() {
  // 1. Переключение языков
  document.getElementById('langControls')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-lang]');
    if (!btn || btn.dataset.lang === state.currentLang) return;
    document.body.style.opacity = '0.5';
    await renderUI(btn.dataset.lang);
    document.body.style.opacity = '1';
  });

  // 2. Клик по карточке (сбор/возврат предмета)
  document.body.addEventListener('click', (e) => {
    const card = e.target.closest('.item-card');
    if (!card) return;

    const itemId = card.dataset.itemId;
    const isPacked = state.packedItems.includes(itemId);

    playSound('click');
    card.style.opacity = '0';
    card.style.transform = 'scale(0.9)';

    setTimeout(() => {
      state.packedItems = isPacked
        ? state.packedItems.filter(id => id !== itemId)
        : [...state.packedItems, itemId];

      saveState();
      renderGrids();
    }, 200);
  });

  // 3. Формы добавления предметов и палитры эмодзи
  document.querySelectorAll('[data-category]').forEach(form => {
    const input = form.querySelector('input');
    const button = form.querySelector('.add-btn');
    const triggerBtn = form.querySelector('.trigger-btn');
    const palette = form.querySelector('.palette');
    const categoryKey = form.dataset.category;
    let selectedEmoji = '🎒';

    triggerBtn.onclick = e => {
      e.stopPropagation();
      palette.classList.toggle('hidden');
    };

    palette.onclick = e => {
      const span = e.target.closest('span');
      if (!span) return;
      selectedEmoji = span.textContent;
      if (triggerBtn) triggerBtn.textContent = selectedEmoji;
      palette.classList.add('hidden');
      playSound('click');
    };

    function handleAdd() {
      const val = input.value.trim();
      if (!val) return;

      state.customItems[categoryKey].push({ id: val, emoji: selectedEmoji });
      saveState();

      input.value = '';
      selectedEmoji = '🎒';
      if (triggerBtn) triggerBtn.textContent = '🎒';

      playSound('click');
      renderGrids();
    };

    button.onclick = handleAdd;
    input.onkeydown = e => { e.key === 'Enter' ?? handleAdd(); };
  });

  document.onclick = () => {
    document.querySelectorAll('.palette').forEach(p => p.classList.add('hidden'));
  };

  // 4. Управление отображением корзины
  togglePackedBtn.onclick = () => {
    packedContainer.classList.toggle('hidden');
    updateProgressAndBanners(state.packedItems.length, 0, 0); // Обновит текст кнопки
  };

  // 5. Кнопка сброса
  resetBtn.onclick = () => {
    if (state.packedItems.length === 0 && Object.values(state.customItems).flat().length === 0) return;
    if (!confirm(state.translations?.confirmReset || 'Сбросить?')) return;

    playSound('click');
    resetState();
    packedContainer?.classList.add('hidden');
    renderGrids();
  };
}

async function init() {
  const saved = localStorage.getItem('preferredLanguage');
  const navLang = navigator.language?.substring(0, 2);
  const startLang = SUPPORTED_LANGS.includes(saved) ? saved : (SUPPORTED_LANGS.includes(navLang) ? navLang : 'ru');

  initTheme(() => playSound('click'));
  initEvents();

  if (state.packedItems.length > 0) packedContainer?.classList.remove('hidden');

  await renderUI(startLang);
}

init().catch(console.error);
