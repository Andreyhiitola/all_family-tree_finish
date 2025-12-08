function renderPeopleTable(people) {
  const tbody = document.querySelector('#data-table tbody')
  if (!tbody) return

  tbody.innerHTML = '' // Очищаем

  if (people.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4">Нет данных</td></tr>'
    return
  }

  people.forEach(person => {
    const row = document.createElement('tr')
    row.innerHTML = `
      <td>${person.id}</td>
      <td>${person.name}</td>
      <td>${person.surname}</td>
      <td>
        <button class="btn-view" data-id="${person.id}">👁 Показать</button>
        <button class="btn-edit" data-id="${person.id}">✏️ Ред.</button>
      </td>
    `
    tbody.appendChild(row)
  })

  // Обработчики кнопок
  tbody.querySelectorAll('.btn-view').forEach(btn => {
    btn.onclick = () => {
      const id = parseInt(btn.dataset.id)
      // Закрываем модалку
      document.getElementById('data-table-modal').style.display = 'none'
      // Строим дерево от выбранного человека
      if (window.appInstance) {
        window.appInstance.setRootAndRender(id)
      }
    }
  })

  tbody.querySelectorAll('.btn-edit').forEach(btn => {
    btn.onclick = () => {
      const id = parseInt(btn.dataset.id)
      document.getElementById('data-table-modal').style.display = 'none'
      if (window.appInstance) {
        window.appInstance.openPersonForm(id)
      }
    }
  })
}

window.renderPeopleTable = renderPeopleTable
