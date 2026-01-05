/**
 * GitHubSync - автоматическое сохранение данных в GitHub
 * Позволяет редактировать данные и сохранять их прямо в репозиторий
 */

class GitHubSync {
  constructor(config) {
    // Конфигурация
    this.token = config.token || null
    this.owner = config.owner || null  // Ваш username на GitHub
    this.repo = config.repo || null    // Название репозитория
    this.branch = config.branch || 'main'
    this.filePath = config.filePath || 'data/people.json'
    
    // Кеш SHA файла (нужен для обновления)
    this.fileSHA = null
    
    // Проверка конфигурации
    this.isConfigured = !!(this.token && this.owner && this.repo)
    
    if (this.isConfigured) {
      console.log('✅ GitHub Sync настроен:', this.owner + '/' + this.repo)
    } else {
      console.warn('⚠️ GitHub Sync не настроен. Нужны: token, owner, repo')
    }
  }

  /**
   * Проверить настройку
   */
  isEnabled() {
    return this.isConfigured
  }

  /**
   * Получить текущее содержимое файла из GitHub
   */
  async fetchFile() {
    if (!this.isConfigured) {
      throw new Error('GitHub Sync не настроен')
    }

    const url = 'https://api.github.com/repos/' + this.owner + '/' + this.repo + 
                '/contents/' + this.filePath + '?ref=' + this.branch

    console.log('📡 Получение файла из GitHub:', url)

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + this.token,
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      if (!response.ok) {
        throw new Error('HTTP ' + response.status + ': ' + response.statusText)
      }

      const data = await response.json()
      
      // Сохраняем SHA для будущих обновлений
      this.fileSHA = data.sha
      
      // Декодируем содержимое (base64)
      const content = atob(data.content)
      const jsonData = JSON.parse(content)
      
      console.log('✅ Файл получен из GitHub')
      return jsonData
      
    } catch (error) {
      console.error('❌ Ошибка получения файла:', error)
      throw error
    }
  }

  /**
   * Сохранить данные в GitHub
   */
  async saveFile(data, commitMessage) {
    if (!this.isConfigured) {
      throw new Error('GitHub Sync не настроен')
    }

    const url = 'https://api.github.com/repos/' + this.owner + '/' + this.repo + 
                '/contents/' + this.filePath

    console.log('💾 Сохранение файла в GitHub:', url)

    try {
      // Если SHA не известен, получаем его
      if (!this.fileSHA) {
        try {
          await this.fetchFile()
        } catch (e) {
          console.warn('⚠️ Не удалось получить SHA, файл может быть новым')
        }
      }

      // Кодируем данные в base64
      const jsonString = JSON.stringify(data, null, 2)
      const base64Content = btoa(unescape(encodeURIComponent(jsonString)))

      // Формируем запрос
      const body = {
        message: commitMessage || 'Обновление данных семейного дерева',
        content: base64Content,
        branch: this.branch
      }

      // Добавляем SHA если есть (для обновления существующего файла)
      if (this.fileSHA) {
        body.sha = this.fileSHA
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + this.token,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error('HTTP ' + response.status + ': ' + (errorData.message || response.statusText))
      }

      const result = await response.json()
      
      // Обновляем SHA
      this.fileSHA = result.content.sha
      
      console.log('✅ Файл сохранен в GitHub')
      console.log('📝 Commit:', result.commit.html_url)
      
      return result
      
    } catch (error) {
      console.error('❌ Ошибка сохранения файла:', error)
      throw error
    }
  }

  /**
   * Синхронизировать данные: загрузить с GitHub
   */
  async pullFromGitHub() {
    try {
      const data = await this.fetchFile()
      return data.people || data
    } catch (error) {
      console.error('❌ Не удалось загрузить с GitHub:', error)
      throw error
    }
  }

  /**
   * Синхронизировать данные: отправить в GitHub
   */
  async pushToGitHub(people, message) {
    try {
      const data = { people: people }
      await this.saveFile(data, message)
      console.log('✅ Данные отправлены в GitHub')
    } catch (error) {
      console.error('❌ Не удалось отправить в GitHub:', error)
      throw error
    }
  }

  /**
   * Получить статус синхронизации
   */
  getStatus() {
    return {
      enabled: this.isConfigured,
      owner: this.owner,
      repo: this.repo,
      branch: this.branch,
      filePath: this.filePath,
      hasSHA: !!this.fileSHA
    }
  }

  /**
   * Создать токен GitHub (инструкция)
   */
  static getTokenInstructions() {
    return `
📝 Как создать GitHub токен:

1. Откройте: https://github.com/settings/tokens
2. Нажмите "Generate new token" → "Generate new token (classic)"
3. Введите название: "Family Tree App"
4. Выберите срок действия: 90 days (или больше)
5. Выберите права (scopes):
   ✅ repo (полный доступ к репозиториям)
6. Нажмите "Generate token"
7. СКОПИРУЙТЕ токен (он больше не появится!)
8. Сохраните его в безопасном месте

⚠️ ВАЖНО: Не публикуйте токен в открытом коде!
    `
  }
}

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GitHubSync
}
window.GitHubSync = GitHubSync
