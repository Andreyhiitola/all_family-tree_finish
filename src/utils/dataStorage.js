/**
 * Модуль для работы с данными семейного древа
 * Автозагрузка из JSON + localStorage
 */

window.saveToLocalStorage = function(people) {
  localStorage.setItem('familyTreeData', JSON.stringify(people));
  console.log(`✅ Сохранено ${people.length} записей в localStorage`);
};

window.loadFromLocalStorage = function() {
  try {
    const data = localStorage.getItem('familyTreeData');
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

window.loadFromJsonFile = async function() {
  try {
    const response = await fetch('./data/family-data.json');
    return await response.json();
  } catch (e) {
    console.log('ℹ️ family-data.json не найден');
    return [];
  }
};

window.initializeData = async function() {
  let data = window.loadFromLocalStorage();
  
  if (!data || data.length === 0) {
    console.log('📂 Загружаем начальные данные...');
    data = await window.loadFromJsonFile();
    if (data.length > 0) {
      window.saveToLocalStorage(data);
    }
  }
  
  return data;
};

// Автозапуск
document.addEventListener('DOMContentLoaded', async () => {
  await window.initializeData();
  if (typeof window.loadPeople === 'function') window.loadPeople();
  if (typeof window.refreshAll === 'function') window.refreshAll();
});
