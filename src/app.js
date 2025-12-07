document.addEventListener('DOMContentLoaded', async () => {
  const dataManager = new DataManager()
  await dataManager.init()

  const familyTree = new FamilyTreeCore(dataManager.getPeople())
  let currentRootId = dataManager.getPeople()[0]?.id || null
  let selectedPersonId = currentRootId
  let personToDelete = null

  const treeViz = new TreeVisualizer({
    svgSelector: '#tree-svg',
    familyTree,
    onNodeClick: (id) => {
      selectedPersonId = id
      currentRootId = id
      treeViz.render(currentRootId)
      updatePersonInfo(id)
    }
  })

  function refreshAll() {
    familyTree.setPeople(dataManager.getPeople())
    if (currentRootId == null && dataManager.getPeople().length) {
      currentRootId = dataManager.getPeople()[0].id
    }
    if (currentRootId != null) treeViz.render(currentRootId)
    updateStats()
  }

  function updatePersonInfo(id) {
    const person = dataManager.getPeople().find(p => p.id === id)
    const placeholder = document.querySelector('.info-placeholder')
    const details = document.querySelector('.person-details')

    if (!person) {
      if (placeholder) placeholder.style.display = 'flex'
      if (details) details.style.display = 'none'
      return
    }

    if (placeholder) placeholder.style.display = 'none'
    if (!details) return
    details.style.display = 'block'
    details.querySelector('[data-field="name"]').textContent = person.name
    details.querySelector('[data-field="surname"]').textContent = person.surname
    details.querySelector('[data-field="birthDate"]').textContent = person.birthDate || '-'
    // и т.д. по нужным полям
  }

  function updateStats() {
    const people = dataManager.getPeople()
    document.getElementById('total-people').textContent = people.length
    // Семей, старший и пр. можно досчитать позже
  }

  const app = {
    openPersonForm(id) {
      const modal = document.getElementById('person-modal')
      const title = document.getElementById('modal-title')
      const people = dataManager.getPeople()
      const person = id ? people.find(p => p.id === id) : null

      const fatherSel = document.getElementById('form-father')
      const motherSel = document.getElementById('form-mother')
      const spouseSel = document.getElementById('form-spouse')
      ;[fatherSel, motherSel, spouseSel].forEach(sel => {
        while (sel.options.length > 1) sel.remove(1)
      })

      people.forEach(p => {
        if (person && p.id === person.id) return
        const text = `${p.name} ${p.surname} (ID: ${p.id})`
        if (p.gender === 'M') fatherSel.add(new Option(text, p.id))
        if (p.gender === 'F') motherSel.add(new Option(text, p.id))
        spouseSel.add(new Option(text, p.id))
      })

      fillPersonFormFromData(person || null)
      title.textContent = person ? `Редактировать: ${person.name} ${person.surname}` : 'Добавить нового человека'
      modal.style.display = 'block'
    },

    savePersonFromForm() {
      const people = dataManager.getPeople()
      const personFromForm = readPersonFromForm()
      let person = personFromForm

      if (!person.id) {
        person.id = dataManager.generateId()
      }

      dataManager.upsertPerson(person)

      // синхронизируем супругов
      if (person.spouseId) {
        const spouse = dataManager.getPeople().find(p => p.id === person.spouseId)
        if (spouse && spouse.spouseId !== person.id) {
          spouse.spouseId = person.id
        }
      }

      document.getElementById('person-modal').style.display = 'none'
      showNotification(personFromForm.id ? 'Данные обновлены' : 'Человек добавлен', 'success')
      refreshAll()
      updatePersonInfo(person.id)
    },

    askDeletePerson(id) {
      personToDelete = id
      const p = dataManager.getPeople().find(x => x.id === id)
      const msg = document.getElementById('delete-message')
      const hasChildren = dataManager.getPeople().some(x => x.fatherId === id || x.motherId === id)
      msg.innerHTML = `Вы действительно хотите удалить <b>${p.name} ${p.surname}</b>?` +
        (hasChildren ? '<br><br><b>Внимание!</b> У этого человека есть дети.' : '')
      document.getElementById('delete-modal').style.display = 'block'
    },

    confirmDeletePerson() {
      if (!personToDelete) return
      dataManager.deletePerson(personToDelete)
      document.getElementById('delete-modal').style.display = 'none'
      personToDelete = null
      showNotification('Человек удалён', 'success')
      selectedPersonId = null
      refreshAll()
    },

    refreshTable() {
      renderPeopleTable(dataManager.getPeople())
    }
  }

  initModals(app)

  document.getElementById('export-excel').addEventListener('click', () => {
    exportPeopleToExcel(dataManager.getPeople())
  })

  document.getElementById('export-json').addEventListener('click', () => {
    exportPeopleToJson(dataManager.getPeople())
  })

  document.getElementById('import-json').addEventListener('click', () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target.result)
          if (Array.isArray(parsed)) {
            dataManager.setPeople(parsed)
            refreshAll()
            showNotification(`Импортировано ${parsed.length} записей из JSON`, 'success')
          } else {
            showNotification('JSON должен содержать массив объектов', 'error')
          }
        } catch (err) {
          showNotification('Ошибка чтения JSON файла', 'error')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  })

  document.getElementById('clear-data').addEventListener('click', () => {
    if (confirm('Удалить все данные?')) {
      dataManager.clearAll()
      refreshAll()
      showNotification('Все данные удалены', 'success')
    }
  })

  const excelFileInput = document.getElementById('excel-file')
  excelFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const importedPeople = await importExcelToPeople(file)
      dataManager.setPeople(importedPeople)
      refreshAll()
      document.getElementById('import-modal').style.display = 'none'
      showNotification(`Импортировано ${importedPeople.length} записей из Excel`, 'success')
    } catch (err) {
      showNotification('Ошибка импорта Excel', 'error')
    }
  })

  const searchInput = document.getElementById('search')
  const people = dataManager.getPeople()
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase()
    if (!query) return
    const p = people.find(person =>
      `${person.name} ${person.surname} ${person.middlename}`.toLowerCase().includes(query)
    )
    if (p) {
      currentRootId = p.id
      selectedPersonId = p.id
      treeViz.render(currentRootId)
      updatePersonInfo(p.id)
    }
  })

  dataManager.startAutoSave(30000, () => {
    const status = document.getElementById('auto-save-status')
    if (status) {
      status.textContent = 'Сохранено'
      setTimeout(() => { status.textContent = 'Автосохранение' }, 3000)
    }
  })

  refreshAll()
})
