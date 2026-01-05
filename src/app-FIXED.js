/**
 * ИСПРАВЛЕННЫЙ app.js
 * Основное приложение с правильной инициализацией
 */

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Запуск приложения...')
  
  // Создаем DataManager
  const dataManager = new DataManager()
  window.dataManagerInstance = dataManager // Глобальный доступ для отладки
  
  // Инициализируем (загружаем данные)
  await dataManager.init()
  
  // Проверяем, загружены ли данные
  if (dataManager.getPeople().length === 0) {
    console.warn('⚠️ Данные не загружены!')
    showNotification('⚠️ Данные не загружены. Проверьте файл data/people.json', 'error')
  } else {
    console.log('✅ Данные загружены:', dataManager.getPeople().length, 'человек')
  }

  // Создаем ядро семейного дерева
  const familyTree = new FamilyTreeCore(dataManager.getPeople())
  window.familyTreeInstance = familyTree // Для отладки
  
  let currentRootId = dataManager.getPeople()[0]?.id || null
  let selectedPersonId = currentRootId
  let personToDelete = null

  // Создаем визуализатор
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
  window.treeVizInstance = treeViz // Для отладки

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
  }
  
  // Глобальный доступ к refreshAll
  window.refreshAll = refreshAll

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
    
    // Заполняем поля
    details.querySelector('[data-field="name"]').textContent = person.name || '-'
    details.querySelector('[data-field="surname"]').textContent = person.surname || '-'
    details.querySelector('[data-field="middlename"]').textContent = person.middlename || '-'
    details.querySelector('[data-field="gender"]').textContent = person.gender === 'M' ? 'Мужской' : 'Женский'
    details.querySelector('[data-field="birthDate"]').textContent = person.birthDate || '-'
    details.querySelector('[data-field="deathDate"]').textContent = person.deathDate || '-'
    details.querySelector('[data-field="birthPlace"]').textContent = person.birthPlace || '-'
    details.querySelector('[data-field="biography"]').textContent = person.biography || '-'
    
    // Привязываем кнопки действий
    const editBtn = document.getElementById('edit-person')
    const deleteBtn = document.getElementById('delete-person')
    
    if (editBtn) {
      editBtn.onclick = () => app.openPersonForm(id)
    }
    
    if (deleteBtn) {
      deleteBtn.onclick = () => app.askDeletePerson(id)
    }
  }

  /**
   * Обновить статистику
   */
  function updateStats() {
    const people = dataManager.getPeople()
    const totalEl = document.getElementById('total-people')
    if (totalEl) {
      totalEl.textContent = people.length
    }
  }

  /**
   * Объект приложения с методами
   */
  const app = {
    /**
     * Открыть форму добавления/редактирования
     */
    openPersonForm(id) {
      const modal = document.getElementById('person-modal')
      const title = document.getElementById('modal-title')
      const people = dataManager.getPeople()
      const person = id ? people.find(p => p.id === id) : null

      // Заполняем селекты родителей и супругов
      const fatherSel = document.getElementById('form-father')
      const motherSel = document.getElementById('form-mother')
      const spouseSel = document.getElementById('form-spouse')
      
      // Очищаем селекты
      ;[fatherSel, motherSel, spouseSel].forEach(sel => {
        while (sel.options.length > 1) sel.remove(1)
      })

      // Заполняем селекты
      people.forEach(p => {
        if (person && p.id === person.id) return
        
        const text = `${p.name} ${p.surname} (ID: ${p.id})`
        
        if (p.gender === 'M') fatherSel.add(new Option(text, p.id))
        if (p.gender === 'F') motherSel.add(new Option(text, p.id))
        spouseSel.add(new Option(text, p.id))
      })

      // Заполняем форму данными
      fillPersonFormFromData(person || null)
      
      // Устанавливаем заголовок
      title.textContent = person 
        ? `Редактировать: ${person.name} ${person.surname}` 
        : 'Добавить нового человека'
      
      // Показываем модальное окно
      modal.style.display = 'block'
    },

    /**
     * Сохранить персону из формы
     */
    savePersonFromForm() {
      const personFromForm = readPersonFromForm()
      let person = personFromForm

      if (!person.id) {
        person.id = dataManager.generateId()
      }

      dataManager.upsertPerson(person)

      // Синхронизируем супругов
      if (person.spouseId) {
        const spouse = dataManager.getPeople().find(p => p.id === person.spouseId)
        if (spouse && spouse.spouseId !== person.id) {
          spouse.spouseId = person.id
          dataManager.upsertPerson(spouse)
        }
      }

      document.getElementById('person-modal').style.display = 'none'
      
      showNotification(
        personFromForm.id ? 'Данные обновлены' : 'Человек добавлен', 
        'success'
      )
      
      refreshAll()
      updatePersonInfo(person.id)
    },

    /**
     * Спросить подтверждение удаления
     */
    askDeletePerson(id) {
      personToDelete = id
      const p = dataManager.getPeople().find(x => x.id === id)
      const msg = document.getElementById('delete-message')
      const hasChildren = dataManager.getPeople().some(x => 
        x.fatherId === id || x.motherId === id
      )
      
      msg.innerHTML = `Вы действительно хотите удалить <b>${p.name} ${p.surname}</b>?` +
        (hasChildren ? '<br><br><b>Внимание!</b> У этого человека есть дети.' : '')
      
      document.getElementById('delete-modal').style.display = 'block'
    },

    /**
     * Подтвердить удаление
     */
    confirmDeletePerson() {
      if (!personToDelete) return
      
      dataManager.deletePerson(personToDelete)
      document.getElementById('delete-modal').style.display = 'none'
      personToDelete = null
      
      showNotification('Человек удалён', 'success')
      
      selectedPersonId = null
      refreshAll()
    },

    /**
     * Обновить таблицу
     */
    refreshTable() {
      renderPeopleTable(dataManager.getPeople())
    }
  }

  // Глобальный доступ к app
  window.app = app

  // Инициализация модальных окон
  initModals(app)

  // ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================

  /**
   * Экспорт в Excel
   */
  document.getElementById('export-excel').addEventListener('click', () => {
    exportPeopleToExcel(dataManager.getPeople())
  })

  /**
   * Экспорт в JSON (уже в index.html)
   */
  document.getElementById('export-json')?.addEventListener('click', () => {
    window.exportJsonFile()
  })

  /**
   * Импорт JSON (уже в index.html)
   */
  document.getElementById('import-json')?.addEventListener('click', () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = window.importJsonFile
    input.click()
  })

  /**
   * Очистить все данные
   */
  document.getElementById('clear-data').addEventListener('click', () => {
    if (confirm('Удалить все данные? Это действие нельзя отменить!')) {
      dataManager.clearAll()
      dataManager.clearCache()
      refreshAll()
      showNotification('Все данные удалены', 'success')
    }
  })

  /**
   * Импорт Excel
   */
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

  /**
   * Поиск
   */
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

  /**
   * Автосохранение
   */
  dataManager.startAutoSave(30000, () => {
    const status = document.getElementById('auto-save-status')
    if (status) {
      status.textContent = '✅ Сохранено'
      setTimeout(() => { 
        status.textContent = '💾 Автосохранение' 
      }, 3000)
    }
  })

  // ==================== ИНИЦИАЛИЗАЦИЯ ====================

  // Первичный рендеринг
  refreshAll()
  
  // Показываем статистику
  const stats = dataManager.getStatistics()
  console.log('📊 Статистика:', stats)
  
  console.log('✅ Приложение инициализировано')
  console.log('👉 Используйте window.debugFamilyTree() для отладки')
})
