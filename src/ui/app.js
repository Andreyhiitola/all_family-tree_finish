document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Family Tree App starting...')

  const dataManager = new window.DataManager()
  await dataManager.init()
  
  const familyTree = new window.FamilyTree(dataManager.getPeople())
  let currentRootId = null

  if (dataManager.getPeople().length > 0) {
    currentRootId = dataManager.getPeople()[0].id
  }

  let selectedPersonId = currentRootId
  let personToDelete = null

  const treeViz = new window.TreeVisualizer({
    svgSelector: '#tree-svg',
    familyTree,
    onNodeClick: (id) => {
      console.log('👆 Клик по человеку:', id)
      selectedPersonId = id
      currentRootId = id
      treeViz.render(currentRootId)
      updatePersonInfo(id)
    }
  })

  function refreshAll() {
    const people = dataManager.getPeople()
    console.log('🔄 refreshAll: людей в базе:', people.length)
    
    familyTree.setPeople(people)

    if (people.length === 0) {
      console.warn('⚠️ Нет людей — дерево не построить')
      currentRootId = null
      return
    }

    let rootPerson = people.find(p => p.id === currentRootId)
    
    if (!rootPerson) {
      const roots = people.filter(p => !p.fatherId && !p.motherId)
      
      if (roots.length > 0) {
        rootPerson = roots[0]
        console.log('🌳 Автоматически выбран корень (без родителей):', rootPerson.name, rootPerson.surname)
      } else {
        rootPerson = people[0]
        console.warn('⚠️ Все люди имеют родителей. Беру первого из списка:', rootPerson.name)
      }
      currentRootId = rootPerson.id
    }

    console.log('🌳 Строю дерево от Root ID:', currentRootId)
    treeViz.render(currentRootId)
    updatePersonInfo(currentRootId)
    updateStats()
  }

  function updatePersonInfo(id) {
    const person = dataManager.getPeople().find(p => p.id === id)
    
    const placeholder = document.querySelector('.info-placeholder')
    const details = document.querySelector('.person-details')

    if (!placeholder || !details) return

    if (!person) {
      placeholder.style.display = 'flex'
      details.style.display = 'none'
      return
    }

    placeholder.style.display = 'none'
    details.style.display = 'block'

    const setText = (selector, value) => {
      const el = details.querySelector(selector)
      if (el) {
        el.textContent = value || '-'
      }
    }

    setText('[data-field="name"]', person.name)
    setText('[data-field="surname"]', person.surname)
    setText('[data-field="middlename"]', person.middlename)
    setText('[data-field="gender"]', person.gender === 'M' ? 'Мужской' : 'Женский')
    setText('[data-field="birthDate"]', person.birthDate)
    setText('[data-field="deathDate"]', person.deathDate)
    setText('[data-field="birthPlace"]', person.birthPlace)
    setText('[data-field="biography"]', person.biography)

    const btnEdit = document.getElementById('edit-person')
    const btnDelete = document.getElementById('delete-person')

    if (btnEdit) btnEdit.onclick = () => app.openPersonForm(id)
    if (btnDelete) btnDelete.onclick = () => app.askDeletePerson(id)
  }

  function updateStats() {
    const el = document.getElementById('total-people')
    if (el) {
      el.textContent = dataManager.getPeople().length
    }
  }

  const app = {
    openPersonForm(id) {
      const modal = document.getElementById('person-modal')
      if (!modal) return

      const title = document.getElementById('modal-title')
      const people = dataManager.getPeople()
      const person = id ? people.find(p => p.id === id) : null

      const fatherSel = document.getElementById('form-father')
      const motherSel = document.getElementById('form-mother')
      const spouseSel = document.getElementById('form-spouse')
      
      const updateSelect = (sel, genderFilter) => {
        if (!sel) return
        sel.innerHTML = sel.dataset.default || '<option value="">— не указан —</option>'
        people.forEach(p => {
          if (person && p.id === person.id) return
          if (genderFilter && p.gender !== genderFilter) return
          sel.add(new Option(`${p.name} ${p.surname} (ID: ${p.id})`, p.id))
        })
      }

      updateSelect(fatherSel, 'M')
      updateSelect(motherSel, 'F')
      updateSelect(spouseSel, null)

      if (window.fillPersonFormFromData) {
        window.fillPersonFormFromData(person)
      }
      
      if (title) title.textContent = person ? `Редактировать: ${person.name}` : 'Добавить человека'
      modal.style.display = 'block'
    },

    savePersonFromForm() {
      if (!window.readPersonFromForm) return
      const person = window.readPersonFromForm()
      dataManager.upsertPerson(person)
      
      const modal = document.getElementById('person-modal')
      if (modal) modal.style.display = 'none'
      
      if (window.showNotification) window.showNotification(person.id ? 'Сохранено' : 'Добавлено', 'success')
      refreshAll()
    },

    askDeletePerson(id) {
      personToDelete = id
      const p = dataManager.getPeople().find(x => x.id === id)
      const msg = document.getElementById('delete-message')
      const modal = document.getElementById('delete-modal')
      
      if (msg && p) {
        msg.innerHTML = `Удалить <b>${p.name} ${p.surname}</b> (ID: ${p.id})?`
      }
      if (modal) modal.style.display = 'block'
    },

    confirmDeletePerson() {
      if (personToDelete) {
        dataManager.deletePerson(personToDelete)
        const modal = document.getElementById('delete-modal')
        if (modal) modal.style.display = 'none'
        personToDelete = null
        if (window.showNotification) window.showNotification('Удалено', 'success')
        refreshAll()
      }
    },

    refreshTable() {
      if (window.renderPeopleTable) {
        window.renderPeopleTable(dataManager.getPeople())
      }
    },

    setRootAndRender(id) {
      console.log('🔄 Переключаем корень на ID:', id)
      currentRootId = id
      selectedPersonId = id
      refreshAll()
    },

    // 👇 НОВЫЙ МЕТОД: Открывает профиль человека
    openPersonProfile(id) {
      const person = dataManager.getPeople().find(p => p.id === id)
      if (!person) {
        console.error('❌ Человек не найден:', id)
        return
      }

      const modal = document.getElementById('profile-modal')
      if (!modal) {
        console.error('❌ Модалка профиля не найдена в HTML!')
        return
      }

      console.log('👤 Открываем профиль:', person.name, person.surname)

      // Аватар
      const avatar = document.getElementById('profile-avatar')
      if (avatar) {
        avatar.src = person.photo || 'https://via.placeholder.com/200?text=No+Photo'
        avatar.alt = `${person.name} ${person.surname}`
      }

      // ФИО
      const nameEl = document.getElementById('profile-name')
      if (nameEl) {
        nameEl.textContent = `${person.name} ${person.middlename} ${person.surname}`.trim()
      }

      // Даты
      const datesEl = document.getElementById('profile-dates')
      if (datesEl) {
        const birth = person.birthDate || '?'
        const death = person.deathDate ? ` — ${person.deathDate}` : ''
        datesEl.textContent = `${birth}${death}`
      }

      // Место
      const placeEl = document.getElementById('profile-place')
      if (placeEl) {
        placeEl.textContent = person.birthPlace || 'Место рождения неизвестно'
      }

      // Биография
      const bioEl = document.getElementById('profile-biography')
      if (bioEl) {
        bioEl.textContent = person.biography || 'Биография не указана.'
      }

      // Галерея
      const galleryEl = document.getElementById('profile-gallery')
      if (galleryEl) {
        galleryEl.innerHTML = ''
        const photos = person.photos || []
        
        if (photos.length === 0) {
          galleryEl.innerHTML = '<p style="color:#999;">Нет дополнительных фото</p>'
        } else {
          photos.forEach(photoUrl => {
            const img = document.createElement('img')
            img.src = photoUrl
            img.alt = 'Фото'
            img.onclick = () => window.open(photoUrl, '_blank')
            galleryEl.appendChild(img)
          })
        }
      }

      modal.style.display = 'block'
    }
  }

  window.appInstance = app

  if (window.initModals) {
    window.initModals(app)
  }

  const btnAdd = document.getElementById('add-person')
  if (btnAdd) btnAdd.onclick = () => app.openPersonForm(null)

  const btnShowTable = document.getElementById('show-data-table')
  if (btnShowTable) {
    btnShowTable.onclick = () => {
      app.refreshTable()
      const modal = document.getElementById('data-table-modal')
      if (modal) modal.style.display = 'block'
    }
  }

  const btnExport = document.getElementById('export-excel')
  if (btnExport) btnExport.onclick = () => window.exportPeopleToExcel && window.exportPeopleToExcel(dataManager.getPeople())

  const btnClear = document.getElementById('clear-data')
  if (btnClear) btnClear.onclick = () => {
    if (confirm('Очистить все данные?')) {
      dataManager.clearAll()
      refreshAll()
      if (window.showNotification) window.showNotification('Очищено', 'success')
    }
  }
  
  const excelInput = document.getElementById('excel-file')
  if (excelInput) {
    excelInput.onchange = async (e) => {
      const file = e.target.files[0]
      if (file && window.importExcelToPeople) {
        try {
          const people = await window.importExcelToPeople(file)
          dataManager.setPeople(people)
          refreshAll()
          document.getElementById('import-modal').style.display = 'none'
          if (window.showNotification) window.showNotification(`Импорт: ${people.length} человек`, 'success')
        } catch (e) {
          console.error(e)
          if (window.showNotification) window.showNotification('Ошибка Excel', 'error')
        }
      }
    }
  }

  dataManager.startAutoSave(10000)

  refreshAll()
  console.log('✅ App fully loaded!')
})

window.closeModal = function() {
  document.querySelectorAll(".modal").forEach(modal => {
    modal.classList.remove("show");
    setTimeout(() => modal.style.display = "none", 300);
  });
  document.body.style.overflow = "auto";
};

window.openModal = function(id) {
  const modal = document.getElementById(id || "person-modal");
  modal.style.display = "flex";
  setTimeout(() => modal.classList.add("show"), 10);
  document.body.style.overflow = "hidden";
};

// ESC закрывает модалку
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

