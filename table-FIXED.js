/**
 * ИСПРАВЛЕННЫЙ table.js
 * Интеграция с ProfileModal для показа профилей
 */

window.renderPeopleTable = function renderPeopleTable(people) {
  const tbody = document.querySelector('#data-table tbody')
  if (!tbody) {
    console.error('❌ Таблица не найдена')
    return
  }
  
  tbody.innerHTML = ''
  
  people.forEach(person => {
    const row = tbody.insertRow()
    
    // ID
    const cellId = row.insertCell()
    cellId.textContent = person.id
    
    // Имя
    const cellName = row.insertCell()
    cellName.textContent = person.name
    
    // Фамилия
    const cellSurname = row.insertCell()
    cellSurname.textContent = person.surname
    
    // Действия
    const cellActions = row.insertCell()
    cellActions.className = 'table-actions'
    
    // Кнопка "Показать профиль"
    const btnView = document.createElement('button')
    btnView.className = 'btn btn-view'
    btnView.innerHTML = '👁 Показать'
    btnView.title = 'Открыть профиль'
    btnView.onclick = () => {
      console.log('👁 Открываем профиль для ID:', person.id)
      openPersonProfile(person.id)
    }
    
    // Кнопка "Редактировать"
    const btnEdit = document.createElement('button')
    btnEdit.className = 'btn btn-edit'
    btnEdit.innerHTML = '✏️'
    btnEdit.title = 'Редактировать'
    btnEdit.onclick = () => {
      console.log('✏️ Редактируем ID:', person.id)
      if (window.app && typeof window.app.openPersonForm === 'function') {
        window.app.openPersonForm(person.id)
        // Закрываем модал таблицы
        document.getElementById('data-table-modal').style.display = 'none'
      } else {
        alert('Функция редактирования недоступна')
      }
    }
    
    // Кнопка "Удалить"
    const btnDelete = document.createElement('button')
    btnDelete.className = 'btn btn-delete'
    btnDelete.innerHTML = '🗑'
    btnDelete.title = 'Удалить'
    btnDelete.onclick = () => {
      console.log('🗑 Удаляем ID:', person.id)
      if (window.app && typeof window.app.askDeletePerson === 'function') {
        window.app.askDeletePerson(person.id)
        // Закрываем модал таблицы
        document.getElementById('data-table-modal').style.display = 'none'
      } else {
        alert('Функция удаления недоступна')
      }
    }
    
    cellActions.appendChild(btnView)
    cellActions.appendChild(btnEdit)
    cellActions.appendChild(btnDelete)
  })
  
  console.log('✅ Таблица отрендерена:', people.length, 'записей')
}

/**
 * Открыть профиль человека
 */
function openPersonProfile(personId) {
  console.log('🎯 openPersonProfile вызван для ID:', personId)
  
  // Проверяем наличие ProfileModal
  if (typeof window.profileModal === 'undefined') {
    console.error('❌ ProfileModal не инициализирован')
    alert('Ошибка: ProfileModal не найден. Перезагрузите страницу.')
    return
  }
  
  // Закрываем модал таблицы
  const tableModal = document.getElementById('data-table-modal')
  if (tableModal) {
    tableModal.style.display = 'none'
  }
  
  // Открываем профиль
  window.profileModal.open(personId)
}

// Глобальный доступ
window.openPersonProfile = openPersonProfile

console.log('✅ table.js загружен с поддержкой ProfileModal')
