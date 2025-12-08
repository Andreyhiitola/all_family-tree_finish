class DataManager {
  constructor(storageKey = 'familyTreeData') {
    this.storageKey = storageKey
    this.people = []
    this.isModified = false
    this.autoSaveTimer = null
  }

  async init() {
    console.log('📥 DataManager: Загрузка...')
    const json = localStorage.getItem(this.storageKey)
    if (json) {
      try {
        const parsed = JSON.parse(json)
        this.people = Array.isArray(parsed) ? parsed : (parsed.people || [])
        console.log(`✅ Загружено ${this.people.length} человек`)
      } catch (e) { 
        console.error('Ошибка чтения:', e)
        this.people = [] 
      }
    }
    this.normalizePeople()
  }

  normalizePeople() {
    this.people = this.people.map(p => {
      const id = parseInt(p.id, 10) || 0
      const toId = (val) => {
          const n = parseInt(val, 10)
          return (isNaN(n) || n === 0) ? null : n
      }
      return {
        id: id,
        name: (p.name || '').trim(),
        surname: (p.surname || '').trim(),
        middlename: (p.middlename || '').trim(),
        gender: (p.gender === 'F' || p.gender === 'Ж') ? 'F' : 'M',
        birthDate: p.birthDate || '',
        deathDate: p.deathDate || '',
        birthPlace: p.birthPlace || '',
        biography: p.biography || '',
        photo: p.photo || '',
        fatherId: toId(p.fatherId),
        motherId: toId(p.motherId),
        spouseId: toId(p.spouseId)
      }
    }).filter(p => p.id !== 0)
  }

  generateId() { 
    if (this.people.length === 0) return 1
    return this.people.reduce((max, p) => Math.max(max, p.id || 0), 0) + 1 
  }

  getPeople() { 
    return this.people 
  }
  
  setPeople(people) { 
    this.people = people || []
    this.normalizePeople()
    this.isModified = true
    this.save()
  }

  upsertPerson(person) {
    if (!person.id) person.id = this.generateId()
    const idx = this.people.findIndex(p => p.id === person.id)
    if (idx === -1) {
      this.people.push(person)
    } else {
      this.people[idx] = person
    }
    this.isModified = true
    this.normalizePeople()
    this.save()
  }

  deletePerson(id) {
    this.people = this.people.filter(p => p.id !== id)
    this.isModified = true
    this.save()
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({ people: this.people }))
      this.isModified = false
    } catch(e) { 
      console.error('Ошибка сохранения:', e) 
    }
  }

  startAutoSave(intervalMs = 10000) {
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer)
    this.autoSaveTimer = setInterval(() => {
      if (this.isModified) {
        this.save()
      }
    }, intervalMs)
  }

  clearAll() {
    this.people = []
    this.save()
  }
}

window.DataManager = DataManager
