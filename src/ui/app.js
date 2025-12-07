document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Family Tree App v3 starting...')

  const dataManager = new window.DataManager()
  await dataManager.init()
  console.log(`📊 Загружено ${dataManager.getPeople().length} человек`)

  const familyTree = new window.FamilyTreeCore(dataManager.getPeople())
  let currentRootId = dataManager.getPeople()[0]?.id || null
  let selectedPersonId = currentRootId
  let personToDelete = null

  const treeViz = new window.TreeVisualizer({
    svgSelector: '#tree-svg',
    familyTree,
    onNodeClick: (id) => {
      console.log('👆 Клик:', id)
      selectedPersonId = id
      currentRootId = id
      treeViz.render(currentRootId)
      updatePersonInfo(id)
    }
  })

  function refreshAll() {
    familyTree.setPeople(dataManager.getPeople())
    if (currentRootId == null && dataManager.getPeople().length > 0) {
      currentRootId = dataManager.getPeople()[0].id
    }
    if (currentRootId != null) treeViz.render(currentRootId)
    updateStats()
  }

  function updatePersonInfo(id) {
    const person = dataManager.getPeople().find(p => p.id === id)
    const placeholder = document.querySelector('.info-placeholder')
    const details = document.querySelector('.person-details')

    if (!person || !details) {
      if (placeholder) placeholder.style.display = 'flex'
      if (details) details.style.display = 'none'
      return
    }

    if (placeholder) placeholder.style.display = 'none'
    details.style.display = 'block'
    details.querySelector('[data-field="name"]').textContent = person.name || ''
    details.querySelector('[data-field="surname"]').textContent = person.surname || ''
    details.querySelector('[data-field="gender"]').textContent = person.gender === 'M' ? 'Мужской' : 'Женский'
    details.querySelector('[data-field="birthDate"]').textContent = person.birthDate || '-'
    details.querySelector('[data-field="deathDate"]').textContent = person.deathDate || '-'
    details.querySelector('[data-field="birthPlace"]').textContent = person.birthPlace || '-'
    details.querySelector('[data-field="middlename"]').textContent = person.middlename || '-'
    const bioEl = details.querySelector('[data-field="biography"]')
    if (bioEl) bioEl.textContent = person.biography || ''
  }

  function updateStats() {
    const el = document.getElementById('total-people')
    if (el) el.textContent = dataManager.getPeople().length
  }

  const app = {
    openPersonForm(id) {
      const modal = document.getElementById('person-modal')
      if (!modal) return
      const title = document.getElementById('modal-title')
      if (title) title.textContent = id ? 'Редактировать' : 'Добавить'
      
      const people = dataManager.getPeople()
      const person = id ? people.find(p => p.id === id) : null

      const fatherSel = document.getElementById('form-father')
      const motherSel = document.getElementById('form-mother')
      const spouseSel = document.getElementById('form-spouse')
      
      if (fatherSel) fatherSel.innerHTML = '<option value="">— отец —</option>'
      if (motherSel) motherSel.innerHTML = '<option value="">— мать —</option>'
      if (spouseSel) spouseSel.innerHTML = '<option value="">— супруг —</option>'

      people.forEach(p => {
        if (person && p.id === person.id) return
        const text = `${p.name} ${p.surname} (${p.id})`
        if (fatherSel && p.gender === 'M') fatherSel.add(new Option(text, p.id))
        if (motherSel && p.gender === 'F') motherSel.add(new Option(text, p.id))
        if (spouseSel) spouseSel.add(new Option(text, p.id))
      })

      window.fillPersonFormFromData(person)
      modal.style.display = 'block'
    },

    savePersonFromForm() {
      const person = window.readPersonFromForm()
      dataManager.upsertPerson(person)
      const modal = document.getElementById('person-modal')
      if (modal) modal.style.display = 'none'
      window.showNotification(person.id ? '✅ Сохранено' : '➕ Добавлено', 'success')
      refreshAll()
    },

    askDeletePerson(id) {
      personToDelete = id
      const p = dataManager.getPeople().find(x => x.id === id)
      const msgEl = document.getElementById('delete-message')
      if (msgEl && p) {
        msgEl.innerHTML = `Удалить <b>${p.name} ${p.surname}</b> (ID: ${p.id})?`
        document.getElementById('delete-modal').style.display = 'block'
      }
    },

    confirmDeletePerson() {
      if (personToDelete) {
        dataManager.deletePerson(personToDelete)
        const modal = document.getElementById('delete-modal')
        if (modal) modal.style.display = 'none'
        personToDelete = null
        window.showNotification('🗑 Удалено', 'success')
        refreshAll()
      }
    },

    refreshTable() {
      window.renderPeopleTable(dataManager.getPeople())
    }
  }

  // ✅ БЕЗОПАСНАЯ привязка кнопок
  const addBtn = document.getElementById('add-person')
  if (addBtn) addBtn.onclick = () => app.openPersonForm(null)

  const exportExcelBtn = document.getElementById('export-excel')
  if (exportExcelBtn) exportExcelBtn.onclick = () => window.exportPeopleToExcel(dataManager.getPeople())

  const tableBtn = document.getElementById('show-data-table')
  if (tableBtn) tableBtn.onclick = () => { app.refreshTable(); document.getElementById('data-table-modal').style.display = 'block' }

  const clearBtn = document.getElementById('clear-data')
  if (clearBtn) clearBtn.onclick = () => {
    if (confirm('🗑 Очистить ВСЕ данные?')) {
      dataManager.clearAll()
      refreshAll()
      window.showNotification('Очищено', 'success')
    }
  }

  // ✅ Excel импорт (БЕЗОБРАЗНО безопасно)
  const excelInput = document.getElementById('excel-file')
  if (excelInput) {
    excelInput.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      try {
        const people = await window.importExcelToPeople(file)
        dataManager.setPeople(people)
        refreshAll()
        const modal = document.getElementById('import-modal')
        if (modal) modal.style.display = 'none'
        window.showNotification(`📥 Импорт: ${people.length}`, 'success')
      } catch(e) {
        window.showNotification('❌ Ошибка Excel', 'error')
      }
    }
  }

  // Инициализация модалок (если есть)
  if (window.initModals) window.initModals(app)

  dataManager.startAutoSave(10000)
  refreshAll()
  console.log('✅ App полностью готово!')
})
