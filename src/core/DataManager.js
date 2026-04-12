class DataManager {
  constructor(storageKey = 'familyTreeData') {
    this.storageKey = storageKey
    this.versionKey = 'familyTreeVersion'
    this.currentVersion = '1.0.5'
    
    this.people = []
    this.isModified = false
    this.autoSaveTimer = null
    
    this.basePath = this.detectBasePath()
    this.dataPath = this.basePath + 'data/people.json'
    this.photosPath = this.basePath + 'photos'
  }

  detectBasePath() {
    const hostname = window.location.hostname
    const port = window.location.port
    
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname === '0.0.0.0' ||
        hostname === '' ||
        port === '8760' ||
        window.location.protocol === 'file:') {
      console.log('🏠 Режим: локальная разработка')
      return './'
    }
    
    if (hostname.includes('github.io')) {
      const pathname = window.location.pathname
      const match = pathname.match(/^\/([^\/]+)/)
      const repoName = match ? match[1] : ''
      console.log('🌐 Режим: GitHub Pages, репозиторий:', repoName)
      return repoName ? ('/' + repoName + '/') : '/'
    }
    
    console.log('🌐 Режим: продакшн сервер')
    return '/'
  }

  async init() {
    console.log('📥 DataManager: Загрузка...')
    console.log('📂 Базовый путь:', this.basePath)
    console.log('📂 Путь к данным:', this.dataPath)
    
    const cachedVersion = localStorage.getItem(this.versionKey)
    const isCacheValid = cachedVersion === this.currentVersion
    
    if (!isCacheValid && cachedVersion) {
      console.log('🔄 Обновление версии:', cachedVersion, '→', this.currentVersion)
      this.clearCache()
    }
    
    if (isCacheValid) {
      const cached = this.loadFromCache()
      if (cached && cached.length > 0) {
        this.people = cached
        this.normalizePeople()
        console.log('✅ Загружено из кеша:', this.people.length, 'человек')
        return
      }
    }
    
    try {
      console.log('📡 Загрузка из JSON файла:', this.dataPath)
      const data = await this.loadFromJSON()
      
      if (data && data.length > 0) {
        this.people = data
        this.normalizePeople()
        this.saveToCache()
        console.log('✅ Загружено из JSON:', this.people.length, 'человек')
      } else {
        console.warn('⚠️ JSON файл пуст')
        this.people = []
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки JSON:', error)
      
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          this.people = Array.isArray(parsed) ? parsed : (parsed.people || [])
          this.normalizePeople()
          console.log('⚠️ Загружено из старого кеша:', this.people.length, 'человек')
        } catch (e) {
          console.error('❌ Ошибка чтения кеша:', e)
          this.people = []
        }
      }
    }
  }

  async loadFromJSON() {
    const timestamp = new Date().getTime()
    const url = this.dataPath + '?t=' + timestamp
    
    console.log('🌐 Запрос:', url)
    
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
    
    console.log('📊 HTTP статус:', response.status, response.statusText)
    
    if (!response.ok) {
      throw new Error('HTTP ' + response.status + ': ' + response.statusText)
    }
    
    const data = await response.json()
    
    if (Array.isArray(data)) {
      return data
    } else if (data.people && Array.isArray(data.people)) {
      return data.people
    } else {
      throw new Error('Неверный формат JSON')
    }
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
        photos: Array.isArray(p.photos) ? p.photos : [],
        events: Array.isArray(p.events) ? p.events : [],
        fatherId: toId(p.fatherId),
        motherId: toId(p.motherId),
        spouseId: toId(p.spouseId)
      }
    }).filter(p => p.id !== 0)
    
    console.log('✅ Нормализовано:', this.people.length, 'человек')
  }

  loadFromCache() {
    try {
      const json = localStorage.getItem(this.storageKey)
      if (!json) return null
      
      const parsed = JSON.parse(json)
      const data = Array.isArray(parsed) ? parsed : (parsed.people || [])
      
      return data.length > 0 ? data : null
    } catch (e) {
      console.error('❌ Ошибка чтения кеша:', e)
      return null
    }
  }

  saveToCache() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({ people: this.people }))
      localStorage.setItem(this.versionKey, this.currentVersion)
      console.log('💾 Сохранено в кеш')
    } catch (e) {
      console.error('❌ Ошибка сохранения в кеш:', e)
    }
  }

  clearCache() {
    localStorage.removeItem(this.storageKey)
    localStorage.removeItem(this.versionKey)
    console.log('🗑️ Кеш очищен')
  }

  async reload() {
    console.log('🔄 Принудительная перезагрузка...')
    this.clearCache()
    this.people = []
    await this.init()
    return this.people
  }

  getPhotoUrl(photoPath) {
    if (!photoPath) {
      return this.photosPath + '/default-avatar.png'
    }
    
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
      return photoPath
    }
    
    if (photoPath.startsWith('/')) {
      return photoPath
    }
    
    if (photoPath.startsWith('photos/') || photoPath.startsWith('avatars/')) {
      return this.basePath + photoPath
    }
    
    return this.photosPath + '/avatars/' + photoPath
  }

  getGalleryUrls(photos) {
    if (!Array.isArray(photos)) return []
    
    const self = this
    return photos.map(function(photo) {
      if (!photo) return null
      return self.getPhotoUrl(photo)
    }).filter(function(url) {
      return url !== null
    })
  }
  generateId() {
    if (this.people.length === 0) return 1
    return this.people.reduce(function(max, p) {
      return Math.max(max, p.id || 0)
    }, 0) + 1
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
    const idx = this.people.findIndex(function(p) {
      return p.id === person.id
    })
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
    this.people = this.people.filter(function(p) {
      return p.id !== id
    })
    this.isModified = true
    this.save()
  }

  save() {
    this.saveToCache()
    this.isModified = false
  }

  startAutoSave(intervalMs, callback) {
    const self = this
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer)
    
    this.autoSaveTimer = setInterval(function() {
      if (self.isModified) {
        self.save()
        if (callback) callback()
      }
    }, intervalMs)
    
    console.log('⏰ Автосохранение запущено:', intervalMs, 'мс')
  }

  clearAll() {
    this.people = []
    this.save()
  }

  getStatistics() {
    return {
      total: this.people.length,
      males: this.people.filter(function(p) { return p.gender === 'M' }).length,
      females: this.people.filter(function(p) { return p.gender === 'F' }).length,
      withPhotos: this.people.filter(function(p) { return p.photo }).length,
      withGallery: this.people.filter(function(p) { return p.photos && p.photos.length > 0 }).length,
      living: this.people.filter(function(p) { return !p.deathDate }).length,
      deceased: this.people.filter(function(p) { return p.deathDate }).length
    }
  }

  getDebugInfo() {
    return {
      version: this.currentVersion,
      hostname: window.location.hostname,
      port: window.location.port,
      protocol: window.location.protocol,
      basePath: this.basePath,
      dataPath: this.dataPath,
      photosPath: this.photosPath,
      peopleCount: this.people.length,
      cacheVersion: localStorage.getItem(this.versionKey),
      statistics: this.getStatistics()
    }
  }
}

window.DataManager = DataManager
