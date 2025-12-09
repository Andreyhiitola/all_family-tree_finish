class DataStorage {
  static save(data) {
    try {
      localStorage.setItem('familyTreeData', JSON.stringify(data));
      console.log('✅ Сохранено в localStorage:', data.length, 'записей');
      return true;
    } catch (e) {
      console.error('❌ Ошибка сохранения:', e);
      return false;
    }
  }

  static load() {
    try {
      const data = localStorage.getItem('familyTreeData');
      if (!data) return [];
      const parsed = JSON.parse(data);
      console.log('✅ Загружено из localStorage:', parsed.length, 'записей');
      return parsed;
    } catch (e) {
      console.error('❌ Ошибка загрузки:', e);
      return [];
    }
  }

  static clear() {
    localStorage.removeItem('familyTreeData');
    console.log('✅ localStorage очищен');
  }

  static importJSON(jsonData) {
    try {
      const parsed = Array.isArray(jsonData) ? jsonData : JSON.parse(jsonData);
      this.save(parsed);
      console.log('✅ Импортировано из JSON:', parsed.length, 'записей');
      return parsed;
    } catch (e) {
      console.error('❌ Ошибка импорта JSON:', e);
      return null;
    }
  }
}

// старые функции импорта/экспорта через input/кнопки
window.importJsonFile = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      DataStorage.save(data);

      if (typeof window.loadPeople === 'function') {
        window.loadPeople();
      }
      if (typeof window.refreshAll === 'function') {
        window.refreshAll();
      }

      console.log(`✅ Импортировано ${data.length} записей из JSON`);
      alert(`✅ Импортировано ${data.length} записей`);
    } catch (error) {
      console.error('❌ Ошибка JSON:', error);
      alert('❌ Неверный формат JSON');
    }
  };
  reader.readAsText(file);
};

window.exportJsonFile = function() {
  const data = DataStorage.load() || [];
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `family-tree-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  console.log(`✅ Экспортировано ${data.length} записей в JSON`);
};

window.DataStorage = DataStorage;
