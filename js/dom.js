// js/dom.js

export function createCardElement(id, emoji, name, index, isCustom, onDelete) {
  const card = document.createElement('div');
  card.className = 'item-card';
  card.dataset.itemId = id;

  card.innerHTML = `
    <div class="item-emoji">${emoji}</div>
    <div class="item-name"></div>
    <div class="item-number">${index + 1}</div>
  `;

  // Безопасное добавление текста во избежание XSS
  card.querySelector('.item-name').textContent = name;

  if (isCustom) {
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '❌';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onDelete(id);
    });
    card.appendChild(deleteBtn);
  }

  return card;
}

export function updateI18nElements(translations) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (translations[key]) el.textContent = translations[key];
  });

  document.querySelectorAll('[data-i18n-holder]').forEach(el => {
    const key = el.dataset.i18nHolder;
    if (translations[key]) el.placeholder = translations[key];
  });
}
