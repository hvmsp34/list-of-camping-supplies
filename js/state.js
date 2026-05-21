// js/state.js

export const SUPPORTED_LANGS = ['ru', 'en', 'de', 'es', 'fr'];

export const state = {
  currentLang: 'ru',
  translations: null,
  packedItems: JSON.parse(localStorage.getItem('packedCampingItems')) || [],
  customItems: JSON.parse(localStorage.getItem('customCampingItems')) || { additionally: [] }
};

export async function loadTranslations(lang) {
  try {
    const response = await fetch(`./locales/${lang}.json`);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    state.translations = await response.json();
    state.currentLang = lang;
    localStorage.setItem('preferredLanguage', lang);
    return state.translations;
  } catch (error) {
    if (lang !== 'ru') return loadTranslations('ru');
    throw error;
  }
}

export function saveState() {
  localStorage.setItem('packedCampingItems', JSON.stringify(state.packedItems));
  localStorage.setItem('customCampingItems', JSON.stringify(state.customItems));
}

export function resetState() {
  state.packedItems = [];
  state.customItems = { aptechka: [], byt: [], odezhda: [] };
  localStorage.removeItem('packedCampingItems');
  localStorage.removeItem('customCampingItems');
}
