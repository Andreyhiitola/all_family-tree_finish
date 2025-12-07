class DataManager {
  constructor() { 
    this.people = []; 
    this.isModified = false; 
    this.autoSaveTimer = null; 
  }
  async init() {
    console.log('🔍 DataManager.init() — проверяем LocalStorage...')
    const saved = localStorage.getItem('familyTreeData')
    console.log('💾 LocalStorage:', saved ? 'есть' : 'пусто')
    
    if (saved) {
      try { 
        const parsed = JSON.parse(saved)
        this.people = Array.isArray(parsed.people) ? parsed.people : parsed || []
        console.log('✅ Загружено из LocalStorage:', this.people.length, 'человек')
      } catch(e) { 
        console.warn('❌ LocalStorage сломан, пробуем демо')
        this.people = []
      }
    } 
    
    if (this.people.length === 0) {
      console.log('🚀 Загружаем ДЕМО семью...')
      try {
        const resp = await fetch('data/demo-family.json')
        console.log('📄 Демо файл статус:', resp.status)
        if (resp.ok) {
          const demo = await resp.json()
          this.people = Array.isArray(demo) ? demo : []
          console.log('✅ ДЕМО загружено:', this.people.length, 'человек')
          console.log('👀 Первые 3:', this.people.slice(0,3))
        } else {
          console.error('❌ Демо файл не найден:', resp.status)
        }
      } catch(e) { 
        console.error('❌ Fetch демо:', e)
      }
    }
    
    this.normalizePeople()
    console.log('📊 ИТОГО людей:', this.people.length)
    console.log('Пётр (ID=3):', this.people.find(p=>p.id===3))
  }

  normalizePeople() {
    let maxId = 0
    this.people = this.people.map(p => {
      const id = Number(p.id) || 0
      if (id > maxId) maxId = id
      return {
        id, name: p.name||'', surname: p.surname||'', middlename: p.middlename||'',
        gender: p.gender==='F'?'F':'M', birthDate: p.birthDate||'', deathDate: p.deathDate||'',
        birthPlace: p.birthPlace||'', biography: p.biography||'', photo: p.photo||'',
        fatherId: Number(p.fatherId)||null, motherId: Number(p.motherId)||null, spouseId: Number(p.spouseId)||null
      }
    })
  }

  generateId() { return this.people.reduce((m,p)=>Math.max(m,p.id||0),0)+1 }
  getPeople() { return this.people }
  setPeople(p) { this.people = p||[]; this.isModified = true }
  upsertPerson(p) {
    if (!p.id) p.id = this.generateId()
    const i = this.people.findIndex(x=>x.id===p.id)
    if (i===-1) this.people.push(p)
    else this.people[i] = p
    this.isModified = true
  }
  deletePerson(id) { this.people = this.people.filter(p=>p.id!==id); this.isModified = true }
  save() { localStorage.setItem('familyTreeData',JSON.stringify({people:this.people})); this.isModified=false }
  startAutoSave(t=10000) {
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer)
    this.autoSaveTimer = setInterval(()=>this.isModified&&this.save(),t)
  }
}
window.DataManager = DataManager
