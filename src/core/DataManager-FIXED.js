/**
 * ИСПРАВЛЕННЫЙ DataManager
 * Решает проблемы:
 * 1. Загрузка из data/people.json при первом запуске
 * 2. Правильное кеширование с версионностью
 * 3. Управление путями к фотографиям
 * 4. Принудительная перезагрузка данных
 */

class DataManager {
  constructor(storageKey = 'familyTreeData') {
    this.storageKey = storageKey
    this.versionKey = 'familyTreeVersion'
    this.currentVersion = '1.0.3' // Увеличивайте при изменениях
    
    this.people = []
    this.isModified = false
    this.autoSaveTimer = null
    
    // Пути к файлам
    this.basePath = this.detectBasePath()
    this.dataPath = `${this.basePath}data/people.json`
    this.photosPath = `${this.basePath}photos`
  }

  /**
   * Определить базовый путь (для GitHub Pages и локальной разработки)
   */
  detectBasePath() {
    // Для локальной разработки
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' ||
        window.location.protocol === 'file:') {
      console.log('🏠 Режим: локальная разработка')
      return './'
    }
    
    // Для GitHub Pages
    if (window.location.hostname.includes('github.io')) {
      const pathname = window.location.pathname
      const match = pathname.match(/^\/([^\/]+)/)
      const repoName = match ? match[1] : ''
      console.log('🌐 Режим: GitHub Pages, репозиторий:', repoName)
      return repoName ? `/${repoName}/` : '/'
    }
    
    // Для своего домена
    console.log('🌐 Режим: свой домен')
    return '/'
  }

  /**
   * Инициализация - загружает данные
   */
  async init() {
    console.log('📥 DataManager: Инициализация...')
    console.log('📂 Базовый путь:', this.basePath)
    console.log('📂 Путь к данным:', this.dataPath)
    
    // Проверяем версию кеша
    const cachedVersion = localStorage.getItem(this.versionKey)
    const isCacheValid = cachedVersion === this.currentVersion
    
    if (!isCacheValid && cachedVersion) {
      console.log(`🔄 Обновление версии: ${cachedVersion} → ${this.currentVersion}`)
      this.clearCache()
    }
    
    // Пытаемся загрузить из кеша
    if (isCacheValid) {
      const cached = this.loadFromCache()
      if (cached && cached.length > 0) {
        this.people = cached
        this.normalizePeople()
        console.log(`✅ Загружено из кеша: ${this.people.length} человек`)
        return
      }
    }
    
    // Загружаем из JSON файла
    try {
      console.log('📡 Загрузка из JSON файла:', this.dataPath)
      const data = await this.loadFromJSON()
      
      if (data && data.length > 0) {
        this.people = data
        this.normalizePeople()
        this.saveToCache()
        console.log(`✅ Загружено из JSON: ${this.people.length} человек`)
      } else {
        console.warn('⚠️ JSON файл пуст или не найден')
        this.people = []
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки JSON:', error)
      
      // Пытаемся загрузить из localStorage как fallback
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          this.people = Array.isArray(parsed) ? parsed : (parsed.people || [])
          this.normalizePeople()
          console.log(`⚠️ Загружено из старого кеша: ${this.people.length} человек`)
        } catch (e) {
          console.error('❌ Ошибка чтения кеша:', e)
          this.people = []
        }
      }
    }
  }

  /**
   * Загрузить данные из JSON файла
   */
  async loadFromJSON() {
    try {
      // Добавляем timestamp для обхода кеша браузера
      const timestamp = new Date().getTime()
      const url = `${this.dataPath}?t=${timestamp}`
      
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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Обрабатываем разные форматы
      if (Array.isArray(data)) {
        return data
      } else if (data.people && Array.isArray(data.people)) {
        return data.people
      } else {
        throw new Error('Неверный формат JSON')
      }
      
    } catch (error) {
      console.error('❌ Ошибка загрузки JSON:', error)
      throw error
    }
  }

  /**
   * Нормализация данных
   */
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
        fatherId: toId(p.fatherId),
        motherId: toId(p.motherId),
        spouseId: toId(p.spouseId)
      }
    }).filter(p => p.id !== 0)
    
    console.log('✅ Нормализовано:', this.people.length, 'человек')
  }

  /**
   * Загрузить из кеша
   */
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

  /**
   * Сохранить в кеш
   */
  saveToCache() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({ people: this.people }))
      localStorage.setItem(this.versionKey, this.currentVersion)
      console.log('💾 Сохранено в кеш')
    } catch (e) {
      console.error('❌ Ошибка сохранения в кеш:', e)
    }
  }

  /**
   * Очистить кеш
   */
  clearCache() {
    localStorage.removeItem(this.storageKey)
    localStorage.removeItem(this.versionKey)
    console.log('🗑️ Кеш очищен')
  }

  /**
   * Принудительно перезагрузить данные из JSON
   */
  async reload() {
    console.log('🔄 Принудительная перезагрузка данных...')
    this.clearCache()
    this.people = []
    await this.init()
    return this.people
  }

  /**
   * Получить URL аватара
   */
  getPhotoUrl(photoPath) {
    if (!photoPath) {
      return `${this.photosPath}/default-avatar.png`
    }
    
    // Если это полный URL
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
      return photoPath
    }
    
    // Если это абсолютный путь
    if (photoPath.startsWith('/')) {
      return photoPath
    }
    
    // Относительный путь
    return `${this.photosPath}/avatars/${photoPath}`
  }

  /**
   * Получить URLs фотогалереи
   */
  getGalleryUrls(photos) {
    if (!Array.isArray(photos)) return []
    
    return photos.map(photo => {
      if (!photo) return null
      
      // Полный URL
      if (photo.startsWith('http://') || photo.startsWith('https://')) {
        return photo
      }
      
      // Абсолютный путь
      if (photo.startsWith('/')) {
        return photo
      }
      
      // Относительный путь
      return `${this.photosPath}/gallery/${photo}`
    }).filter(url => url !== null)
  }

  /**
   * Генерация ID
   */
  generateId() { 
    if (this.people.length === 0) return 1
    return this.people.reduce((max, p) => Math.max(max, p.id || 0), 0) + 1 
  }

  /**
   * Получить всех людей
   */
  getPeople() { 
    return this.people 
  }
  
  /**
   * Установить данные
   */
  setPeople(people) { 
    this.people = people || []
    this.normalizePeople()
    this.isModified = true
    this.save()
  }

  /**
   * Добавить или обновить человека
   */
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

  /**
   * Удалить человека
   */
  deletePerson(id) {
    this.people = this.people.filter(p => p.id !== id)
    this.isModified = true
    this.save()
  }

  /**
   * Сохранить
   */
  save() {
    this.saveToCache()
    this.isModified = false
  }

  /**
   * Автосохранение
   */
  startAutoSave(intervalMs = 10000, callback) {
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer)
    
    this.autoSaveTimer = setInterval(() => {
      if (this.isModified) {
        this.save()
        if (callback) callback()
      }
    }, intervalMs)
    
    console.log('⏰ Автосохранение запущено:', intervalMs, 'мс')
  }

  /**
   * Очистить все данные
   */
  clearAll() {
    this.people = []
    this.save()
  }

  /**
   * Получить статистику
   */
  getStatistics() {
    return {
      total: this.people.length,
      males: this.people.filter(p => p.gender === 'M').length,
      females: this.people.filter(p => p.gender === 'F').length,
      withPhotos: this.people.filter(p => p.photo).length,
      withGallery: this.people.filter(p => p.photos && p.photos.length > 0).length,
      living: this.people.filter(p => !p.deathDate).length,
      deceased: this.people.filter(p => p.deathDate).length
    }
  }

  /**
   * Отладочная информация
   */
  getDebugInfo() {
    return {
      version: this.currentVersion,
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
