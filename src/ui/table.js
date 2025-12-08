function renderPeopleTable(people) {
  const tbody = document.querySelector('#data-table tbody')
  if (!tbody) {
    console.error('❌ Таблица #data-table не найдена в HTML!')
    return
  }

  tbody.innerHTML = ''

  if (people.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">Нет данных</td></tr>'
    return
  }

  people.forEach(person => {
    const row = document.createElement('tr')
    row.innerHTML = `
      <td style="text-align:center;">${person.id}</td>
      <td>${person.name}</td>
      <td>${person.surname}</td>
      <td style="text-align:center;">
        <button class="btn-profile" data-id="${person.id}">👤 Профиль</button>
        <button class="btn-view" data-id="${person.id}">👁 Дерево</button>
        <button class="btn-edit" data-id="${person.id}">✏️ Ред.</button>
      </td>
    `
    tbody.appendChild(row)
  })

  // Кнопка "👤 Профиль"
  tbody.querySelectorAll('.btn-profile').forEach(btn => {
    btn.onclick = () => {
      const id = parseInt(btn.dataset.id, 10)
      console.log('👤 Открываем профиль для ID:', id)
      
      const modal = document.getElementById('data-table-modal')
      if (modal) modal.style.display = 'none'
      
      if (window.appInstance && window.appInstance.openPersonProfile) {
        window.appInstance.openPersonProfile(id)
      } else {
        console.error('❌ Метод openPersonProfile не найден!')
      }
    }
  })

  // Кнопка "👁 Показать" - строит дерево от этого человека
  tbody.querySelectorAll('.btn-view').forEach(btn => {
    btn.onclick = () => {
      const id = parseInt(btn.dataset.id, 10)
      console.log('👁 Клик на "Показать" для ID:', id)
      
      const modal = document.getElementById('data-table-modal')
      if (modal) modal.style.display = 'none'
      
      if (window.appInstance && window.appInstance.setRootAndRender) {
        window.appInstance.setRootAndRender(id)
      } else {
        console.error('❌ window.appInstance не найден!')
      }
    }
  })

  // Кнопка "✏️ Редактировать"
  tbody.querySelectorAll('.btn-edit').forEach(btn => {
    btn.onclick = () => {
      const id = parseInt(btn.dataset.id, 10)
      console.log('✏️ Клик на "Редактировать" для ID:', id)
      
      const modal = document.getElementById('data-table-modal')
      if (modal) modal.style.display = 'none'
      
      if (window.appInstance && window.appInstance.openPersonForm) {
        window.appInstance.openPersonForm(id)
      }
    }
  })
}

window.renderPeopleTable = renderPeopleTable
