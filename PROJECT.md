# 📘 PROJECT.md — Техническая документация

Полная техническая документация проекта "Семейное древо" для разработчиков.

---

## 📋 Содержание

1. [Архитектура](#архитектура)
2. [Модули и их функции](#модули-и-их-функции)
3. [Структура данных](#структура-данных)
4. [Алгоритмы](#алгоритмы)
5. [Система авторизации](#система-авторизации)
6. [API и интеграции](#api-и-интеграции)
7. [Разработка](#разработка)

---

## 🏗️ Архитектура

### Общая схема
```
┌─────────────────────────────────────────┐
│           index.html (UI)               │
├─────────────────────────────────────────┤
│  ┌───────────┐  ┌──────────────────┐   │
│  │  Core     │  │  UI Components   │   │
│  │           │  │                  │   │
│  │ DataMgr   │  │  app.js          │   │
│  │ FamilyTree│  │  forms.js        │   │
│  │ TreeVis   │  │  table.js        │   │
│  └───────────┘  │  ProfileModal.js │   │
│                 └──────────────────┘   │
├─────────────────────────────────────────┤
│  ┌───────────┐  ┌──────────────────┐   │
│  │  Utils    │  │  Auth & Sync     │   │
│  │           │  │                  │   │
│  │ Excel I/O │  │  auth.js         │   │
│  │ Storage   │  │  GitHubSync.js   │   │
│  └───────────┘  └──────────────────┘   │
├─────────────────────────────────────────┤
│       LocalStorage     GitHub API       │
│       data/people.json                  │
└─────────────────────────────────────────┘
```

### Принципы

- **Модульность:** Каждый модуль отвечает за свою область
- **Разделение ответственности:** Core → Logic, UI → View, Utils → Helpers
- **Event-driven:** Использование событий для связи компонентов
- **Stateless UI:** UI не хранит состояние, только отображает

---

## 🧩 Модули и их функции

### Core

#### `DataManager.js`
**Назначение:** Централизованное управление данными

**Основные методы:**
```javascript
class DataManager {
  loadFromJSON()           // Загрузка из data/people.json
  savePeople(people)       // Сохранение в LocalStorage
  getPeople()              // Получить всех людей
  getPersonById(id)        // Получить человека по ID
  addPerson(person)        // Добавить нового человека
  updatePerson(id, data)   // Обновить данные человека
  deletePerson(id)         // Удалить человека
  getPhotoUrl(photo)       // Получить URL фото
  getGalleryUrls(photos)   // Получить URL галереи
  clearCache()             // Очистить кэш версий
}
```

**Кэширование:**
- Версионирование файлов: `?v=1.0.5`
- Автоматическая инвалидация при изменениях

#### `FamilyTree.js`
**Назначение:** Логика построения семейного дерева

**Основные методы:**
```javascript
class FamilyTree {
  getPersonById(id)                    // Получить человека
  getChildrenOf(personId)              // Дети человека
  getChildrenOfCouple(p1, p2)          // Дети конкретной пары
  getAllSpouses(personId)              // Все супруги (текущие + бывшие)
  buildDescendantsHierarchy(rootId)    // Построить дерево потомков
  getSpousePairs()                     // Все пары супругов
}
```

**Алгоритм `buildDescendantsHierarchy`:**
```javascript
// 1. Проверка: есть ли у человека несколько супругов
const spouses = this.getAllSpouses(personId)

// 2. Если супругов > 1 → создать узел-разделитель (separator)
if (spouses.length > 1) {
  const separatorNode = {
    type: 'separator',
    person: {...},
    children: []
  }
  
  // 3. Для каждого супруга создать узел брака (marriage)
  spouses.forEach(spouse => {
    const marriageNode = {
      type: 'marriage',
      person1: {...},
      person2: {...},
      children: []
    }
    
    // 4. Получить детей ТОЛЬКО от этой пары
    const children = this.getChildrenOfCouple(personId, spouse.id)
    
    // 5. Рекурсивно построить поддерево для каждого ребенка
    children.forEach(child => {
      marriageNode.children.push(buildFamilyNode(child, depth + 1))
    })
    
    separatorNode.children.push(marriageNode)
  })
  
  return separatorNode
}

// 6. Если супруг один → обычный узел семьи (family)
const familyNode = {
  type: 'family',
  person1: {...},
  person2: {...},
  children: []
}
```

**Метод `getAllSpouses`:**
```javascript
getAllSpouses(personId) {
  const spouses = []
  const person = this.getPersonById(personId)
  
  // 1. Текущий супруг из spouseId
  if (person?.spouseId) {
    spouses.push(this.getPersonById(person.spouseId))
  }
  
  // 2. Бывшие супруги через детей
  const children = this.getChildrenOf(personId)
  children.forEach(child => {
    const otherId = person.gender === "M" ? child.motherId : child.fatherId
    if (otherId && otherId !== person.spouseId) {
      const other = this.getPersonById(otherId)
      if (other && !spouses.find(s => s.id === other.id)) {
        spouses.push(other)
      }
    }
  })
  
  return spouses.filter(s => s)
}
```

**Метод `getChildrenOfCouple`:**
```javascript
getChildrenOfCouple(person1Id, person2Id) {
  if (!person2Id) {
    return this.getChildrenOf(person1Id) // Все дети если супруга нет
  }
  
  const person1 = this.getPersonById(person1Id)
  const children = this.getChildrenOf(person1Id)
  
  // Фильтруем: только дети от ЭТОЙ пары
  return children.filter(child => {
    if (person1.gender === "M") {
      return child.fatherId === person1Id && child.motherId === person2Id
    } else {
      return child.motherId === person1Id && child.fatherId === person2Id
    }
  })
}
```

#### `TreeVisualizer.js`
**Назначение:** Визуализация дерева с помощью D3.js

**Основные методы:**
```javascript
class TreeVisualizer {
  render(rootId)           // Отрисовать дерево от корня
  drawPerson(container,    // Нарисовать узел человека
             offsetX, 
             dataAccessor)
}
```

**Типы узлов:**
```javascript
// type: 'family' - обычная семья (муж + жена + дети)
{
  type: 'family',
  person1: {...},   // Основной человек
  person2: {...},   // Супруг
  children: [...]   // Дети
}

// type: 'separator' - разделитель множественных браков
{
  type: 'separator',
  person: {...},    // Человек с несколькими браками
  children: [...]   // Массив marriage узлов
}

// type: 'marriage' - конкретный брак
{
  type: 'marriage',
  person1: {...},
  person2: {...},
  children: [...]   // Дети от ЭТОГО брака
}
```

**Отрисовка узлов:**
```javascript
// Обработка разных типов узлов
allNodes.each((d, i, nodes) => {
  const node = d3.select(nodes[i])
  
  if (d.data.type === 'separator') {
    // Серый кружок-разделитель (r=12px)
    node.append('circle')
      .attr('r', 12)
      .attr('fill', '#999999')
      .attr('stroke', '#666666')
  } 
  else if (d.data.type === 'marriage' || d.data.type === 'family') {
    // Пара людей (person1 и person2)
    this.drawPerson(node, -25, n => n.data.person1)
    
    if (d.data.person2) {
      this.drawPerson(node, 25, n => n.data.person2)
      
      // Красная линия брака между супругами
      node.append('line')
        .attr('class', 'marriage-line')
        .attr('stroke', '#FF6B6B')
    }
  }
})
```

### UI Components

#### `app.js`
**Главный контроллер приложения**

**Основные функции:**
```javascript
// Инициализация
async function init()

// Отображение информации о человеке
function showPersonInfo(id)

// Открытие формы добавления/редактирования
function openPersonForm(id)

// Удаление человека
function askDeletePerson(id)
function confirmDeletePerson()

// Обновление интерфейса
function refreshAll()
function refreshTree()
function refreshTable()
```

#### `ProfileModal.js`
**Модальное окно профиля с галереей**

**Особенности:**
- Полноэкранный режим
- Горизонтальная галерея с прокруткой
- Просмотр фото с навигацией (prev/next)
- Поддержка клавиатуры (стрелки, ESC)
- Скрытие даты смерти для живых людей

**Методы:**
```javascript
class ProfileModal {
  open(personId)                // Открыть профиль
  close()                       // Закрыть профиль
  fillBasicInfo(person)         // Заполнить основную информацию
  fillGallery(person)           // Заполнить галерею
  openPhotoModal(photoUrl)      // Открыть просмотр фото
  closePhotoModal()             // Закрыть просмотр фото
  showNextPhoto()               // Следующее фото
  showPrevPhoto()               // Предыдущее фото
}
```

#### `forms.js`
**Формы добавления и редактирования людей**

**Функции:**
```javascript
function populateForm(person)    // Заполнить форму данными
function fillForm(person)        // Заполнить поля формы
function getFormData()           // Получить данные из формы
```

#### `table.js`
**Таблица всех людей**

**Функции:**
```javascript
function renderTable(people)     // Отрисовать таблицу
```

**Колонки:**
- ID
- Имя
- Фамилия
- Пол
- Дата рождения
- Действия: 👁 Профиль, ✏️ Редактировать, 🗑 Удалить

### Utils

#### `dataStorage.js`
**Работа с LocalStorage и экспорт/импорт JSON**
```javascript
// Экспорт данных в JSON файл
window.exportJsonFile = function()

// Импорт данных из JSON файла
window.importJsonFile = function(event)
```

#### `importExcel.js` / `exportExcel.js`
**Импорт и экспорт данных в/из Excel**

**Формат Excel:**
| ID | Имя | Фамилия | Отчество | Пол | Дата рождения | Дата смерти | ... |
|----|-----|---------|----------|-----|---------------|-------------|-----|
| 1  | Иван| Иванов  | Петрович | M   | 1980-05-15    |             | ... |

#### `GitHubSync.js`
**Синхронизация с GitHub через REST API**
```javascript
class GitHubSync {
  constructor(config)              // { token, owner, repo, branch, filePath }
  
  async fetchFile()                // Получить файл из GitHub
  async updateFile(content, msg)   // Обновить файл в GitHub
  
  isEnabled()                      // Проверка настроек
  static getTokenInstructions()    // Инструкция по созданию токена
}
```

**API endpoints:**
```javascript
// GET файла
GET https://api.github.com/repos/{owner}/{repo}/contents/{path}

// PUT (обновление файла)
PUT https://api.github.com/repos/{owner}/{repo}/contents/{path}
{
  "message": "Update people.json",
  "content": "base64_encoded_content",
  "sha": "current_file_sha",
  "branch": "main"
}
```

---

## 📊 Структура данных

### Person Object
```typescript
interface Person {
  id: number                // Уникальный ID
  name: string              // Имя
  surname: string           // Фамилия
  middlename: string        // Отчество
  gender: 'M' | 'F'         // Пол
  birthDate: string         // YYYY-MM-DD
  deathDate: string         // YYYY-MM-DD или пусто
  birthPlace: string        // Место рождения
  biography: string         // Текст биографии
  photo: string             // photos/avatars/имя.jpg
  photos: string[]          // [photo, gallery1, gallery2, ...]
  fatherId: number | null   // ID отца
  motherId: number | null   // ID матери
  spouseId: number | null   // ID супруга/супруги
}
```

### Tree Node Types
```typescript
// Обычная семья
type FamilyNode = {
  type: 'family'
  id: string
  person1: PersonData
  person2: PersonData | null
  children: TreeNode[]
}

// Разделитель множественных браков
type SeparatorNode = {
  type: 'separator'
  id: string
  person: PersonData
  children: MarriageNode[]
}

// Конкретный брак
type MarriageNode = {
  type: 'marriage'
  id: string
  person1: PersonData
  person2: PersonData
  children: TreeNode[]
}

type TreeNode = FamilyNode | SeparatorNode | MarriageNode
```

### LocalStorage Keys
```javascript
{
  "family_tree_data": JSON.stringify(people),      // Массив людей
  "github_token": "ghp_xxxxx",                      // GitHub токен
  "github_owner": "username",                       // GitHub username
  "github_repo": "repo-name",                       // Название репо
  "auth_token": "ghp_xxxxx",                        // Токен авторизации (sessionStorage)
  "auth_user": "username"                           // Username (sessionStorage)
}
```

---

## 🔐 Система авторизации

### Архитектура
```
┌─────────────────────────────────────┐
│  UI: ⚙️ GitHub button               │
└────────────┬────────────────────────┘
             │ click
             ▼
┌─────────────────────────────────────┐
│  configureGitHub()                  │
│  - prompt для токена                │
│  - сохранение в localStorage        │
└────────────┬────────────────────────┘
             │ localStorage.setItem('github_token')
             ▼
┌─────────────────────────────────────┐
│  auth.js: window.isAuthorized()     │
│  - проверка github_token            │
│  - проверка auth_token              │
└────────────┬────────────────────────┘
             │ authorized?
             ▼
┌─────────────────────────────────────┐
│  window.requireAuth(action)         │
│  - если авторизован → выполнить     │
│  - иначе → показать модалку токена  │
└─────────────────────────────────────┘
```

### Код авторизации

**auth.js:**
```javascript
(function() {
  let isAuthenticated = false
  let authToken = null
  let pendingAction = null

  // Проверка токена через GitHub API
  window.verifyToken = async function() {
    const token = document.getElementById('github-token').value.trim()
    
    const response = await fetch('https://api.github.com/user', {
      headers: { 'Authorization': `token ${token}` }
    })
    
    if (response.ok) {
      const user = await response.json()
      isAuthenticated = true
      authToken = token
      
      sessionStorage.setItem('auth_token', token)
      sessionStorage.setItem('auth_user', user.login)
      
      // Выполнить отложенное действие
      if (pendingAction) {
        pendingAction()
        pendingAction = null
      }
    }
  }

  // Проверка авторизации перед действием
  window.requireAuth = function(action) {
    const savedToken = sessionStorage.getItem('auth_token') || 
                       localStorage.getItem('github_token')
    
    if (savedToken && !isAuthenticated) {
      authToken = savedToken
      isAuthenticated = true
    }
    
    if (isAuthenticated) {
      action()
    } else {
      pendingAction = action
      const modal = document.getElementById('auth-modal')
      if (modal) modal.style.display = 'flex'
    }
  }

  // Проверка статуса
  window.isAuthorized = function() {
    return isAuthenticated || 
           sessionStorage.getItem('auth_token') || 
           localStorage.getItem('github_token')
  }

  // Восстановление сессии
  const savedToken = sessionStorage.getItem('auth_token') || 
                     localStorage.getItem('github_token')
  if (savedToken) {
    authToken = savedToken
    isAuthenticated = true
  }
})()
```

### Защищённые действия

**Где применяется `requireAuth()`:**
```javascript
// 1. Кнопка "Добавить" (modals.js)
document.getElementById('add-person').addEventListener('click', () => {
  window.requireAuth(() => app.openPersonForm(null))
})

// 2. Редактирование в карточке (ui/app.js)
editBtn.onclick = () => window.requireAuth(() => app.openPersonForm(id))

// 3. Удаление в карточке
deleteBtn.onclick = () => window.requireAuth(() => app.askDeletePerson(id))

// 4. Редактирование в таблице (ui/table.js)
btnEdit.onclick = () => {
  window.requireAuth(() => window.app.openPersonForm(person.id))
}

// 5. Удаление в таблице
btnDelete.onclick = () => {
  window.requireAuth(() => window.app.askDeletePerson(person.id))
}

// 6. Импорт JSON (index.html)
<input onchange="window.requireAuth(() => window.importJsonFile(event))">
```

### Показ кнопки "Добавить"

**Логика:**
```javascript
// Кнопка скрыта по умолчанию
<button id="add-person" style="display: none;">➕ Добавить</button>

// После авторизации показывается
function toggleAddButton() {
  const addBtn = document.getElementById('add-person')
  if (!addBtn) return
  
  if (window.isAuthorized()) {
    addBtn.style.display = 'inline-block'
  } else {
    addBtn.style.display = 'none'
  }
}

// Вызывается при каждом изменении статуса авторизации
document.addEventListener('DOMContentLoaded', toggleAddButton)
```

---

## 🔌 API и интеграции

### GitHub REST API

**Endpoints:**
```
GET  /repos/{owner}/{repo}/contents/{path}
PUT  /repos/{owner}/{repo}/contents/{path}
```

**Authentication:**
```javascript
headers: {
  'Authorization': `token ${github_token}`,
  'Accept': 'application/vnd.github.v3+json'
}
```

**Pull (загрузка):**
```javascript
async function pullFromGitHub() {
  const data = await githubSync.fetchFile()
  
  if (data && data.people) {
    dataManager.savePeople(data.people)
    location.reload()
  }
}
```

**Push (сохранение):**
```javascript
async function pushToGitHub() {
  const people = dataManager.getPeople()
  const content = JSON.stringify({ people }, null, 2)
  const message = `Update people.json (${new Date().toLocaleString()})`
  
  await githubSync.updateFile(content, message)
}
```

---

## 🛠️ Разработка

### Требования

- Python 3.x (для локального сервера)
- Современный браузер (Chrome, Firefox, Safari, Edge)
- GitHub аккаунт (для синхронизации)

### Запуск локально
```bash
# Клонировать репозиторий
git clone https://github.com/Andreyhiitola/all_family-tree_finish.git
cd all_family-tree_finish

# Запустить сервер
python -m http.server 8760

# Или использовать скрипт
./start-simple.sh

# Открыть в браузере
http://localhost:8760
```

### Структура разработки
```
1. Core (логика) → src/core/
2. UI (интерфейс) → src/ui/
3. Utils (помощники) → src/utils/
4. Styles → style.css, profile-modal-styles.css
5. Data → data/people.json
```

### Добавление новых фич

**Пример: Добавить новое поле "email"**

1. **Обновить структуру данных**
```javascript
// data/people.json
{
  "id": 1,
  "name": "Иван",
  // ...
  "email": "ivan@example.com"  // ← новое поле
}
```

2. **Добавить в форму редактирования**
```html
<!-- index.html -->
<div class="form-group">
  <label>Email:</label>
  <input type="email" id="email-input">
</div>
```

3. **Обновить forms.js**
```javascript
// Заполнение формы
function fillForm(person) {
  // ...
  document.getElementById('email-input').value = person.email || ''
}

// Получение данных
function getFormData() {
  return {
    // ...
    email: document.getElementById('email-input').value
  }
}
```

4. **Отобразить в профиле**
```javascript
// ProfileModal.js
if (person.email) {
  basicInfo += `<p><strong>Email:</strong> ${person.email}</p>`
}
```

### Дебаггинг

**Консольные команды:**
```javascript
// Получить всех людей
window.dataManager.getPeople()

// Найти человека по ID
window.dataManager.getPersonById(1)

// Получить дерево
window.familyTree.buildDescendantsHierarchy(1)

// Проверить авторизацию
window.isAuthorized()

// Очистить кэш
window.dataManager.clearCache()
```

### Тестирование

**Ручное тестирование:**
1. ✅ Визуализация дерева от разных корней
2. ✅ Добавление нового человека
3. ✅ Редактирование существующего
4. ✅ Удаление человека
5. ✅ Импорт из Excel
6. ✅ Экспорт в Excel
7. ✅ Синхронизация с GitHub (Pull/Push)
8. ✅ Множественные браки
9. ✅ Фотогалереи с навигацией
10. ✅ Авторизация через GitHub токен

---

## 📚 Полезные ссылки

- [D3.js Documentation](https://d3js.org/)
- [SheetJS Documentation](https://docs.sheetjs.com/)
- [GitHub REST API](https://docs.github.com/en/rest)
- [LocalStorage Guide](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

---

## 📞 Контакты

**Вопросы по коду?** Создайте Issue: [GitHub Issues](https://github.com/Andreyhiitola/all_family-tree_finish/issues)

**Автор:** Andreyhiitola  
**Последнее обновление:** Январь 2026

---

## 🌳 Root Family Selector

### Функция выбора корневой семьи

Позволяет переключаться между различными семейными деревьями через dropdown в header.

**Метод findRootFamilies():**
```javascript
findRootFamilies() {
  // Находит всех людей без родителей
  const rootPeople = this.people.filter(p => !p.fatherId && !p.motherId);
  
  // Группирует супружеские пары
  // Сортирует по дате рождения (старшие первые)
  
  return families; // [{id, person1, person2, label}, ...]
}
```

**UI компоненты:**
- Dropdown: `<select id="root-selector">` в header
- Автоматическое заполнение при загрузке
- Обработчик изменения перестраивает дерево

**Глобальные переменные:**
- `window.familyTree` - экземпляр FamilyTreeCore
- `window.treeViz` - экземпляр TreeVisualizer
- Доступны для отладки в консоли

**Использование:**
```javascript
// В консоли браузера
window.familyTree.findRootFamilies() // Список всех корней
window.treeViz.render(5) // Показать дерево от ID 5
```

---

## 🌳 Root Family Selector

### Функция выбора корневой семьи

Позволяет переключаться между различными семейными деревьями через dropdown в header.

**Метод findRootFamilies():**
```javascript
findRootFamilies() {
  // Находит всех людей без родителей
  const rootPeople = this.people.filter(p => !p.fatherId && !p.motherId);
  
  // Группирует супружеские пары
  // Сортирует по дате рождения (старшие первые)
  
  return families; // [{id, person1, person2, label}, ...]
}
```

**UI компоненты:**
- Dropdown: `<select id="root-selector">` в header
- Автоматическое заполнение при загрузке
- Обработчик изменения перестраивает дерево

**Глобальные переменные:**
- `window.familyTree` - экземпляр FamilyTreeCore
- `window.treeViz` - экземпляр TreeVisualizer
- Доступны для отладки в консоли

---

## 🌳 Root Family Selector

### Функция выбора корневой семьи

Позволяет переключаться между различными семейными деревьями через dropdown в header.

**Метод findRootFamilies():**
```javascript
findRootFamilies() {
  // Находит всех людей без родителей
  const rootPeople = this.people.filter(p => !p.fatherId && !p.motherId);
  
  // Группирует супружеские пары
  // Сортирует по дате рождения (старшие первые)
  
  return families; // [{id, person1, person2, label}, ...]
}
```

**UI компоненты:**
- Dropdown: `<select id="root-selector">` в header
- Автоматическое заполнение при загрузке
- Обработчик изменения перестраивает дерево

**Глобальные переменные:**
- `window.familyTree` - экземпляр FamilyTreeCore
- `window.treeViz` - экземпляр TreeVisualizer
- Доступны для отладки в консоли
