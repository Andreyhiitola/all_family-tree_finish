/**
 * ИСПРАВЛЕННЫЙ app.js
 * Основное приложение с правильной инициализацией
 */

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Запуск приложения...')
  
  // Создаем DataManager
  const dataManager = new DataManager()
  window.dataManager = dataManager
  
  await dataManager.init()
  
  if (dataManager.getPeople().length === 0) {
    console.warn('⚠️ Данные не загружены!')
    showNotification('⚠️ Данные не загружены. Проверьте файл data/people.json', 'error')
  } else {
    console.log('✅ Данные загружены:', dataManager.getPeople().length, 'человек')
  }

  window.familyTree = new FamilyTreeCore(dataManager.getPeople())
  const familyTree = window.familyTree
  window.familyTreeInstance = familyTree
  
  let currentRootId = dataManager.getPeople()[0]?.id || null
  let selectedPersonId = currentRootId
  let personToDelete = null

  window.treeViz = new TreeVisualizer({
    svgSelector: '#tree-svg',
    familyTree,
    onNodeClick: (id) => {
      selectedPersonId = id
      currentRootId = id
      treeViz.render(currentRootId)
      updatePersonInfo(id)
    }
  })
  const treeViz = window.treeViz
  window.treeVizInstance = treeViz

  /**
   * Обновить все компоненты
   */
  function refreshAll() {
    console.log('🔄 Обновление компонентов...')
    
    familyTree.setPeople(dataManager.getPeople())
    
    if (currentRootId == null && dataManager.getPeople().length) {
      currentRootId = dataManager.getPeople()[0].id
    }
    
    if (currentRootId != null) {
      treeViz.render(currentRootId)
    }
    
    updateStats()
    window.treeDock?.refresh()
  }

  window.refreshAll = refreshAll

  /**
   * ИНИЦИАЛИЗАЦИЯ PROFILE MODAL
   */
  if (typeof ProfileModal !== 'undefined') {
    window.profileModal = new ProfileModal()
    window.profileModal.init()
    console.log('✅ ProfileModal инициализирован')
  } else {
    console.error('❌ ProfileModal не загружен.')
  }

  if (typeof treeViz !== 'undefined' && treeViz.gNodes) {
    treeViz.gNodes.on('dblclick', function(event, d) {
      event.stopPropagation()
      let personId = null
      if (d.data && d.data.person1) {
        personId = d.data.person1.id
      }
      if (personId && window.profileModal) {
        window.profileModal.open(personId)
      }
    })
    console.log('✅ Двойной клик на узлах дерева активирован')
  }

  function addProfileButtonToSidebar() {
    const detailsDiv = document.querySelector('.person-details')
    if (!detailsDiv) return
    if (detailsDiv.querySelector('#view-profile-btn')) return
    const actionsDiv = detailsDiv.querySelector('.person-actions')
    if (!actionsDiv) return
    
    const viewProfileBtn = document.createElement('button')
    viewProfileBtn.id = 'view-profile-btn'
    viewProfileBtn.className = 'btn btn-primary'
    viewProfileBtn.innerHTML = '👁 Профиль'
    viewProfileBtn.title = 'Показать полный профиль'
    viewProfileBtn.onclick = function() {
      if (selectedPersonId && window.profileModal) {
        window.profileModal.open(selectedPersonId)
      }
    }
    actionsDiv.insertBefore(viewProfileBtn, actionsDiv.firstChild)
    console.log('✅ Кнопка "Профиль" добавлена в боковую панель')
  }

  setTimeout(addProfileButtonToSidebar, 1000)

  window.debugProfile = {
    open: function(id) {
      if (window.profileModal) window.profileModal.open(id)
      else console.error('❌ ProfileModal не инициализирован')
    },
    test: function() {
      const people = dataManager.getPeople()
      if (people.length > 0) window.profileModal.open(people[0].id)
      else console.error('❌ Нет людей для теста')
    },
    stats: function() {
      const people = dataManager.getPeople()
      console.table({
        'Всего людей': people.length,
        'С аватарами': people.filter(p => p.photo).length,
        'С галереями': people.filter(p => p.photos && p.photos.length > 0).length
      })
    }
  }

  /**
   * Обновить информацию о персоне
   */
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
    
    details.querySelector('[data-field="name"]').textContent = person.name || '-'
    details.querySelector('[data-field="surname"]').textContent = person.surname || '-'
    details.querySelector('[data-field="middlename"]').textContent = person.middlename || '-'
    details.querySelector('[data-field="gender"]').textContent = person.gender === 'M' ? 'Мужской' : 'Женский'
    details.querySelector('[data-field="birthDate"]').textContent = person.birthDate || '-'
    details.querySelector('[data-field="deathDate"]').textContent = person.deathDate || '-'
    details.querySelector('[data-field="birthPlace"]').textContent = person.birthPlace || '-'
    details.querySelector('[data-field="biography"]').textContent = person.biography || '-'
    
    const editBtn = document.getElementById('edit-person')
    const deleteBtn = document.getElementById('delete-person')
    
    if (editBtn) editBtn.onclick = () => window.requireAuth(() => app.openPersonForm(id))
    if (deleteBtn) deleteBtn.onclick = () => window.requireAuth(() => app.askDeletePerson(id))
  }

  /**
   * Обновить статистику
   */
  function updateStats() {
    const totalEl = document.getElementById('total-people')
    if (totalEl) totalEl.textContent = dataManager.getPeople().length
  }

  /**
   * Объект приложения
   */
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
      title.textContent = person 
        ? `Редактировать: ${person.name} ${person.surname}` 
        : 'Добавить нового человека'
      modal.style.display = 'block'
    },

    savePersonFromForm() {
      const personFromForm = readPersonFromForm()
      let person = personFromForm

      if (!person.id) person.id = dataManager.generateId()

      dataManager.upsertPerson(person)

      if (person.spouseId) {
        const spouse = dataManager.getPeople().find(p => p.id === person.spouseId)
        if (spouse && spouse.spouseId !== person.id) {
          spouse.spouseId = person.id
          dataManager.upsertPerson(spouse)
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

  window.app = app

  initModals(app)

  // ==================== ОБРАБОТЧИКИ ====================

  document.getElementById('export-excel').addEventListener('click', () => {
    exportPeopleToExcel(dataManager.getPeople())
  })

  document.getElementById('export-json')?.addEventListener('click', () => {
    window.exportJsonFile()
  })

  document.getElementById('import-json')?.addEventListener('click', () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = window.importJsonFile
    input.click()
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
      console.error('Ошибка импорта Excel:', err)
      showNotification('Ошибка импорта Excel: ' + err.message, 'error')
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
      showNotification(`Найдено: ${p.name} ${p.surname}`, 'success')
    }
  })

  dataManager.startAutoSave(30000, () => {
    const status = document.getElementById('auto-save-status')
    if (status) {
      status.textContent = '✅ Сохранено'
      setTimeout(() => { status.textContent = '💾 Автосохранение' }, 3000)
    }
  })

  // ==================== ИНИЦИАЛИЗАЦИЯ ====================

  // Первичный рендеринг
  refreshAll()

  // ── TreeDock: панель переключения деревьев ────────────
  window.treeDock = new TreeDock({
    familyTree: window.familyTree,
    onSelectTree: (rootId) => {
      currentRootId = rootId
      window.treeViz.render(rootId)
    }
  })
  window.treeDock.mount()

  const firstFamily = window.familyTree.findRootFamilies()[0]
  if (firstFamily) window.treeDock.select(firstFamily.id)

  // Fallback для браузеров без :has()
  ;(function applyDockFallback() {
    const dock = document.getElementById('tree-dock')
    const main = document.querySelector('.app-main')
    if (!dock || !main) return
    main.classList.add('dock-open')
    new MutationObserver(() => {
      main.classList.toggle('dock-open', !dock.classList.contains('collapsed'))
      main.classList.toggle('dock-collapsed', dock.classList.contains('collapsed'))
    }).observe(dock, { attributes: true, attributeFilter: ['class'] })
  })()
  // ── конец TreeDock ────────────────────────────────────

  const stats = dataManager.getStatistics()
  console.log('📊 Статистика:', stats)
  console.log('✅ Приложение инициализировано')

  populateRootSelector()
  console.log('👉 Используйте window.debugFamilyTree() для отладки')
})

/**
 * Заполнить селектор корневых семей
 */
function populateRootSelector() {
  const selector = document.getElementById('root-selector')
  if (!selector) return

  const families = window.familyTree.findRootFamilies()
  
  while (selector.options.length > 1) selector.remove(1)

  families.forEach(family => {
    const option = document.createElement('option')
    option.value = family.id
    option.textContent = family.label
    selector.appendChild(option)
  })

  selector.onchange = (e) => {
    const rootId = parseInt(e.target.value)
    if (rootId) {
      window.treeViz.render(rootId)
      window.treeDock?.select(rootId)
    }
  }
}
