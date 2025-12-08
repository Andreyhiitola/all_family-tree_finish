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

window.importJsonFile = function(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = JSON.parse(e.target.result);
    window.saveToLocalStorage(data);
    if (typeof window.loadPeople === 'function') window.loadPeople();
    alert(`Импортировано ${data.length} записей`);
  };
  reader.readAsText(file);
};

window.exportJsonFile = function() {
  const data = window.loadFromLocalStorage() || [];
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `family-tree-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
};
