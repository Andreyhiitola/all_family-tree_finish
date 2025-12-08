[код из Шага 1 выше]

window.importJsonFile = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      window.saveToLocalStorage(data);
      
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
  const data = window.loadFromLocalStorage() || [];
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `family-tree-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  console.log(`✅ Экспортировано ${data.length} записей в JSON`);
};
