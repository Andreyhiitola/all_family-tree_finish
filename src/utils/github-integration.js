/**
 * Интеграция GitHub Sync с DataManager
 * Добавьте этот код в конец вашего app.js
 */

// ============================================================================
// НАСТРОЙКА GITHUB SYNC
// ============================================================================

// Конфигурация (ЗАМЕНИТЕ НА СВОИ ДАННЫЕ)
const GITHUB_CONFIG = {
  token: '',  // ⚠️ ВСТАВЬТЕ СВОЙ ТОКЕН СЮДА
  owner: 'Andreyhiitola',  // Ваш username на GitHub
  repo: 'all_family-tree_finish',  // Название репозитория
  branch: 'main',  // Ветка (обычно main или master)
  filePath: 'data/people.json'  // Путь к файлу в репозитории
}

// Создаем экземпляр GitHub Sync
const githubSync = new GitHubSync(GITHUB_CONFIG)
window.githubSync = githubSync  // Для отладки

// ============================================================================
// ДОБАВЛЕНИЕ КНОПОК В ИНТЕРФЕЙС
// ============================================================================

function addGitHubButtons() {
  const header = document.querySelector('.header-controls')
  if (!header) return

  // Кнопка "Загрузить с GitHub"
  const pullBtn = document.createElement('button')
  pullBtn.className = 'btn btn-github'
  pullBtn.innerHTML = '⬇️ Pull'
  pullBtn.title = 'Загрузить данные из GitHub'
  pullBtn.onclick = pullFromGitHub
  
  // Кнопка "Отправить в GitHub"
  const pushBtn = document.createElement('button')
  pushBtn.className = 'btn btn-github'
  pushBtn.innerHTML = '⬆️ Push'
  pushBtn.title = 'Сохранить данные в GitHub'
  pushBtn.onclick = pushToGitHub
  
  // Кнопка "Настроить GitHub"
  const configBtn = document.createElement('button')
  configBtn.className = 'btn btn-github'
  configBtn.innerHTML = '⚙️ GitHub'
  configBtn.title = 'Настроить GitHub токен'
  configBtn.onclick = configureGitHub
  
  // Добавляем кнопки
  header.appendChild(pullBtn)
  header.appendChild(pushBtn)
  header.appendChild(configBtn)
  
  // Если не настроено - показываем предупреждение
  if (!githubSync.isEnabled()) {
    pullBtn.disabled = true
    pushBtn.disabled = true
    pullBtn.title = 'Сначала настройте GitHub токен'
    pushBtn.title = 'Сначала настройте GitHub токен'
  }
}

// ============================================================================
// ФУНКЦИИ СИНХРОНИЗАЦИИ
// ============================================================================

/**
 * Загрузить данные с GitHub
 */
async function pullFromGitHub() {
  if (!githubSync.isEnabled()) {
    alert('❌ GitHub не настроен. Нажмите ⚙️ GitHub для настройки.')
    return
  }
  
  if (!confirm('Загрузить данные с GitHub? Локальные изменения будут потеряны.')) {
    return
  }
  
  try {
    showNotification('⬇️ Загрузка с GitHub...', 'info')
    
    const people = await githubSync.pullFromGitHub()
    
    // Обновляем данные
    dataManager.setPeople(people)
    
    // Обновляем интерфейс
    if (typeof refreshAll === 'function') {
      refreshAll()
    } else {
      location.reload()
    }
    
    showNotification('✅ Данные загружены с GitHub: ' + people.length + ' человек', 'success')
    
  } catch (error) {
    console.error('❌ Ошибка загрузки:', error)
    showNotification('❌ Ошибка: ' + error.message, 'error')
  }
}

/**
 * Отправить данные в GitHub
 */
async function pushToGitHub() {
  if (!githubSync.isEnabled()) {
    alert('❌ GitHub не настроен. Нажмите ⚙️ GitHub для настройки.')
    return
  }
  
  const message = prompt('Commit message (описание изменений):', 'Обновление данных семейного дерева')
  if (!message) return
  
  try {
    showNotification('⬆️ Отправка в GitHub...', 'info')
    
    const people = dataManager.getPeople()
    await githubSync.pushToGitHub(people, message)
    
    showNotification('✅ Данные отправлены в GitHub', 'success')
    
  } catch (error) {
    console.error('❌ Ошибка отправки:', error)
    showNotification('❌ Ошибка: ' + error.message, 'error')
  }
}

/**
 * Настроить GitHub токен
 */
function configureGitHub() {
  const instructions = GitHubSync.getTokenInstructions()
  
  alert(instructions)
  
  const token = prompt('Введите GitHub токен (Personal Access Token):')
  if (!token) return
  
  const owner = prompt('Введите ваш GitHub username:', GITHUB_CONFIG.owner)
  if (!owner) return
  
  const repo = prompt('Введите название репозитория:', GITHUB_CONFIG.repo)
  if (!repo) return
  
  // Сохраняем в localStorage (ОСТОРОЖНО: не безопасно для продакшна!)
  localStorage.setItem('github_token', token)
  localStorage.setItem('github_owner', owner)
  localStorage.setItem('github_repo', repo)
  
  // Пересоздаем githubSync
  GITHUB_CONFIG.token = token
  GITHUB_CONFIG.owner = owner
  GITHUB_CONFIG.repo = repo
  
  window.githubSync = new GitHubSync(GITHUB_CONFIG)
  
  alert('✅ GitHub настроен! Теперь вы можете использовать кнопки Pull/Push.')
  
  // Перезагружаем страницу для применения изменений
  location.reload()
}

/**
 * Автоматическая отправка в GitHub при изменениях
 */
function enableAutoSync() {
  if (!githubSync.isEnabled()) {
    console.warn('⚠️ Автосинхронизация не включена: GitHub не настроен')
    return
  }
  
  // Перехватываем методы сохранения
  const originalSave = dataManager.save.bind(dataManager)
  
  dataManager.save = function() {
    // Сохраняем локально
    originalSave()
    
    // Отправляем в GitHub (с задержкой, чтобы не спамить)
    clearTimeout(window.githubSyncTimer)
    window.githubSyncTimer = setTimeout(async function() {
      try {
        const people = dataManager.getPeople()
        await githubSync.pushToGitHub(people, 'Автосохранение: ' + new Date().toLocaleString())
        console.log('✅ Автосохранение в GitHub')
      } catch (error) {
        console.error('❌ Ошибка автосохранения:', error)
      }
    }, 5000)  // 5 секунд задержка
  }
  
  console.log('✅ Автосинхронизация с GitHub включена')
}

// ============================================================================
// ЗАГРУЗКА КОНФИГУРАЦИИ ИЗ LOCALSTORAGE
// ============================================================================

function loadGitHubConfigFromStorage() {
  const token = localStorage.getItem('github_token')
  const owner = localStorage.getItem('github_owner')
  const repo = localStorage.getItem('github_repo')
  
  if (token && owner && repo) {
    GITHUB_CONFIG.token = token
    GITHUB_CONFIG.owner = owner
    GITHUB_CONFIG.repo = repo
    
    window.githubSync = new GitHubSync(GITHUB_CONFIG)
    
    console.log('✅ GitHub конфигурация загружена из localStorage')
  }
}

// ============================================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================================

// Загружаем конфигурацию при старте
loadGitHubConfigFromStorage()

// Добавляем кнопки в интерфейс
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(addGitHubButtons, 500)
})

// ОПЦИОНАЛЬНО: Включить автосинхронизацию
// enableAutoSync()

// ============================================================================
// КОНСОЛЬНЫЕ КОМАНДЫ ДЛЯ ОТЛАДКИ
// ============================================================================

window.githubCommands = {
  // Загрузить с GitHub
  pull: pullFromGitHub,
  
  // Отправить в GitHub
  push: pushToGitHub,
  
  // Настроить
  config: configureGitHub,
  
  // Статус
  status: function() {
    console.table(githubSync.getStatus())
  },
  
  // Включить автосинхронизацию
  enableAuto: enableAutoSync,
  
  // Инструкция
  help: function() {
    console.log(`
📚 Команды GitHub Sync:

window.githubCommands.pull()       - Загрузить данные с GitHub
window.githubCommands.push()       - Отправить данные в GitHub
window.githubCommands.config()     - Настроить токен
window.githubCommands.status()     - Проверить статус
window.githubCommands.enableAuto() - Включить автосинхронизацию
    `)
  }
}

console.log('✅ GitHub Sync загружен. Команды: window.githubCommands.help()')
