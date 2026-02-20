# 🌳 Family Tree — Project Summary

> **Репозиторий:** https://github.com/Andreyhiitola/all_family-tree_finish  
> **Стек:** Vanilla JS (ES6+), D3.js v7, SheetJS, FileSaver.js, LocalStorage  
> **Последнее обновление:** Январь 2026

---

## 📁 Структура проекта

```
all_family-tree_finish/
├── index.html
├── style.css
├── d3.v7.min.js / xlsx.full.min.js / FileSaver.min.js
├── example_with_photos_30people.xlsx
│
├── data/                             # people.json
├── photos/
│   ├── avatars/
│   └── gallery/
│
└── src/
    ├── core/
    │   ├── DataManager.js
    │   ├── FamilyTree.js
    │   └── TreeVisualizer.js
    ├── ui/
    │   ├── app.js
    │   ├── forms.js
    │   ├── table.js
    │   ├── modals.js
    │   ├── MapView.js                # 🆕 Карта проживания
    │   └── notifications.js
    └── utils/
        ├── importExcel.js
        ├── exportExcel.js
        ├── dataStorage.js
        ├── auth.js
        └── GitHubSync.js
```

---

## 🗂 Модель данных

```typescript
interface Person {
  id: number
  name: string
  surname: string
  middlename: string
  gender: 'M' | 'F'
  birthDate: string         // YYYY-MM-DD
  deathDate: string
  birthPlace: string
  biography: string
  photo: string
  photos: string[]
  fatherId: number | null
  motherId: number | null
  spouseId: number | null
  // 🆕 Поля для карты:
  birthLat: number | null   // Координаты места рождения
  birthLng: number | null
  liveLat: number | null    // Координаты места проживания
  liveLng: number | null
  livePlace: string         // Текущее место проживания
}
```

**LocalStorage ключи:**
```
family_tree_data   → JSON массив людей
github_token       → GitHub токен (localStorage)
auth_token         → токен сессии (sessionStorage)
auth_user          → username (sessionStorage)
```

---

## ✅ Что работает

- CRUD людей через форму
- Визуализация дерева через D3.js с цветами по фамилии
- Зум и перетаскивание дерева
- Таблица всех людей
- Импорт / экспорт Excel и JSON
- Автосохранение в LocalStorage каждые 30 секунд
- Профили с аватаром и галереей фото
- Множественные браки (тип узла `separator` → `marriage`)
- Авторизация и синхронизация с GitHub (Pull / Push)
- Dropdown выбора корневой семьи через `findRootFamilies()`

---

## 🗺 Новая фича: Карта проживания

### Идея
Интерактивная карта (Leaflet.js — бесплатно, без API-ключа) с аватарками людей на их местах рождения или проживания. Клик по аватарке открывает карточку человека.

### Подключение Leaflet (в `index.html`)
```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

### Новый файл `src/ui/MapView.js`

```javascript
class MapView {
  constructor(containerId, dataManager, onPersonClick) {
    this.dataManager = dataManager
    this.onPersonClick = onPersonClick
    this.markers = []

    // Инициализация карты Leaflet
    this.map = L.map(containerId).setView([55.75, 37.61], 4) // Центр — Москва

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map)
  }

  // Отрисовать всех людей на карте
  render() {
    // Очистить старые маркеры
    this.markers.forEach(m => m.remove())
    this.markers = []

    const people = this.dataManager.getPeople()

    people.forEach(person => {
      const lat = person.liveLat || person.birthLat
      const lng = person.liveLng || person.birthLng

      if (!lat || !lng) return // Пропустить тех, у кого нет координат

      const marker = this.createPersonMarker(person, lat, lng)
      marker.addTo(this.map)
      this.markers.push(marker)
    })
  }

  // Создать маркер-аватарку
  createPersonMarker(person, lat, lng) {
    const photoUrl = person.photo || 'photos/avatars/default.png'
    const color = person.gender === 'M' ? '#4A90D9' : '#E91E8C'

    // Кастомная иконка с аватаркой
    const icon = L.divIcon({
      className: '',
      html: `
        <div class="map-marker" style="border-color: ${color}">
          <img src="${photoUrl}"
               onerror="this.src='photos/avatars/default.png'"
               alt="${person.name}"/>
          <div class="map-marker-name">${person.name}</div>
        </div>
      `,
      iconSize: [52, 64],
      iconAnchor: [26, 64],
      popupAnchor: [0, -64]
    })

    const marker = L.marker([lat, lng], { icon })

    // Клик по маркеру — открыть карточку человека
    marker.on('click', () => {
      this.onPersonClick(person.id)
    })

    // Тултип при наведении
    marker.bindTooltip(`
      <b>${person.name} ${person.surname}</b><br>
      ${person.livePlace || person.birthPlace || ''}
    `, { direction: 'top', offset: [0, -60] })

    return marker
  }

  // Сфокусироваться на конкретном человеке
  focusOn(personId) {
    const person = this.dataManager.getPeople().find(p => p.id === personId)
    const lat = person?.liveLat || person?.birthLat
    const lng = person?.liveLng || person?.birthLng
    if (lat && lng) {
      this.map.flyTo([lat, lng], 10, { duration: 1.2 })
    }
  }
}

window.MapView = MapView
```

### CSS для маркеров (добавить в `style.css`)

```css
.map-marker {
  width: 48px;
  height: 48px;
  border-radius: 50% 50% 50% 0;
  border: 3px solid #4A90D9;
  transform: rotate(-45deg);
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  transition: transform 0.2s, box-shadow 0.2s;
}

.map-marker:hover {
  transform: rotate(-45deg) scale(1.15);
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
}

.map-marker img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: rotate(45deg);  /* компенсируем поворот контейнера */
}

.map-marker-name {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  font-size: 10px;
  white-space: nowrap;
  background: rgba(0,0,0,0.6);
  color: #fff;
  padding: 1px 4px;
  border-radius: 3px;
}
```

### Инициализация в `app.js`

```javascript
const mapView = new MapView('map-container', dataManager, (personId) => {
  openProfileModal(personId) // открыть карточку человека
})
mapView.render()

// При переключении на вкладку карты — обновить размер
document.querySelector('[data-tab="map"]').addEventListener('click', () => {
  setTimeout(() => mapView.map.invalidateSize(), 200)
})
```

### HTML (добавить вкладку в `index.html`)

```html
<!-- Кнопка вкладки -->
<button data-tab="map">🗺 Карта</button>

<!-- Контейнер карты -->
<div id="map-container" style="width:100%; height:600px; display:none;"></div>
```

### Геокодинг: как получить координаты

**Вариант 1 — вручную** (поле в форме редактирования, ввести lat/lng).

**Вариант 2 — автоматически через Nominatim** (бесплатно, без ключа):
```javascript
async function geocodePlace(placeName) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeName)}&format=json&limit=1`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'FamilyTreeApp/1.0' }
  })
  const data = await res.json()
  if (data.length) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  }
  return null
}

// Вызывать при сохранении человека, если заполнено поле birthPlace/livePlace
const coords = await geocodePlace(person.birthPlace)
if (coords) {
  person.birthLat = coords.lat
  person.birthLng = coords.lng
}
```

---

## 🐛 Найденные баги

### Bug 1 — Дерево строится только от одного корня
**Файл:** `app.js`

```js
// ПРОБЛЕМА:
let currentRootId = dataManager.getPeople()[0]?.id || null
treeViz.render(currentRootId)

// ИСПРАВЛЕНИЕ:
const allIds = new Set(people.map(p => p.id))
const roots = people.filter(p => !allIds.has(p.fatherId) && !allIds.has(p.motherId))
roots.forEach(root => treeViz.render(root.id))
```

### Bug 2 — Кнопки "Показать в дереве" нет в таблице
**Файл:** `table.js`

```js
// ИСПРАВЛЕНИЕ — добавить в tr.innerHTML:
<button class="btn-show-tree" data-id="${p.id}" title="Показать в дереве">🌳</button>

tbody.querySelectorAll('.btn-show-tree').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = parseInt(btn.dataset.id)
    document.querySelector('[data-tab="tree"]')?.click()
    setTimeout(() => window.focusPersonInTree?.(id), 150)
  })
})
```

### Bug 3 — D3 zoom не сохранён
**Файл:** `TreeVisualizer.js`

```js
// БЫЛО:
this.svg.call(d3.zoom().on('zoom', ...))

// ИСПРАВЛЕНИЕ:
this.zoom = d3.zoom().scaleExtent([0.1, 3]).on('zoom', e => this.gRoot.attr('transform', e.transform))
this.svg.call(this.zoom)

focusOn(personId) {
  const nodeEl = this.gNodes.selectAll('g.tree-node').filter(d =>
    d.data.id === personId || d.data.person1?.id === personId || d.data.person2?.id === personId
  )
  if (nodeEl.empty()) return
  const { x, y } = nodeEl.datum()
  const transform = d3.zoomIdentity.translate(this.width / 2 - x, this.height / 2 - y).scale(1)
  this.svg.transition().duration(750).call(this.zoom.transform, transform)
  nodeEl.selectAll('rect').classed('node-highlight', true)
  setTimeout(() => nodeEl.selectAll('rect').classed('node-highlight', false), 2500)
}
```

### Bug 4 — Узлы D3 без атрибута `data-id`
```js
.attr('data-id', d => d.data.id)
```

### Bug 5 — Поиск на устаревшем снимке данных
```js
// ИСПРАВЛЕНИЕ: читать getPeople() внутри хендлера
searchInput.addEventListener('input', e => {
  const p = dataManager.getPeople().find(...)
})
```

---

## 🔧 План исправлений

| # | Файл                | Изменение                                         | Приоритет |
|---|---------------------|---------------------------------------------------|-----------|
| 1 | `table.js`          | Добавить кнопку 🌳 и обработчик `showInTree`     | 🔴 Высокий |
| 2 | `TreeVisualizer.js` | Сохранить `this.zoom`, метод `focusOn(id)`        | 🔴 Высокий |
| 3 | `TreeVisualizer.js` | `.attr('data-id', d => d.data.id)` на узлы       | 🔴 Высокий |
| 4 | `app.js`            | `window.focusPersonInTree`                        | 🔴 Высокий |
| 5 | `app.js`            | Поиск читает `getPeople()` внутри хендлера        | 🟡 Средний |
| 6 | `app.js`            | Рендерить все корневые деревья                    | 🟡 Средний |
| 7 | `src/ui/MapView.js` | Новый модуль карты (Leaflet)                      | 🟡 Средний |
| 8 | `forms.js`          | Поля lat/lng и автогеокодинг по Nominatim         | 🟡 Средний |
| 9 | `style.css`         | `.node-highlight` + `.map-marker`                 | 🟢 Низкий  |

---

## 📣 Как привлечь больше людей на GitHub

### 1. README — первое впечатление решает всё

Добавить в `README.md`:
- **GIF или скриншот** работающего дерева и карты — без этого проект не замечают
- Бейджи вверху:
```markdown
![GitHub stars](https://img.shields.io/github/stars/Andreyhiitola/all_family-tree_finish)
![GitHub forks](https://img.shields.io/github/forks/Andreyhiitola/all_family-tree_finish)
![License](https://img.shields.io/badge/license-MIT-blue)
```
- Чёткий заголовок на **английском** (русский сильно сужает аудиторию)
- Раздел `Live Demo` со ссылкой на GitHub Pages

### 2. GitHub Pages — демо обязательно

```bash
# В настройках репо: Settings → Pages → Branch: main → /root
# Сайт появится по адресу:
https://andreyhiitola.github.io/all_family-tree_finish/
```

### 3. Topics (теги репозитория)

В настройках репо добавить теги — по ним люди находят проекты:
```
family-tree, genealogy, d3js, javascript, visualization,
leaflet, open-source, family-history, pedigree, ancestry
```

### 4. Где публиковать ссылку

| Площадка | Что написать |
|----------|--------------|
| **Reddit** r/webdev, r/javascript, r/genealogy | "Built a family tree visualizer with D3.js and a map view" |
| **Dev.to** | Статья "How I built an interactive family tree with D3.js" |
| **Hacker News** (Show HN) | Лаконичный пост с демо-ссылкой |
| **ProductHunt** | Запустить как продукт с описанием и скриншотами |
| **Twitter/X** | Пост с GIF + хэштеги #buildinpublic #javascript #opensource |
| **Telegram** чаты по JS и генеалогии | Прямая ссылка на GitHub Pages |

### 5. Контент внутри репо

- Добавить `CONTRIBUTING.md` — как помочь проекту
- Добавить `LICENSE` (MIT) — без лицензии люди боятся использовать
- Создать несколько **Issues** с тегом `good first issue` — привлекает контрибьюторов
- Добавить `CHANGELOG.md` — показывает что проект живой

### 6. Короткая стратегия на первый месяц

```
Неделя 1: Записать GIF, обновить README на английском, включить GitHub Pages
Неделя 2: Опубликовать на Reddit r/genealogy и r/javascript
Неделя 3: Написать статью на Dev.to со ссылкой на репо
Неделя 4: ProductHunt или Show HN
```

---

## 🗺 Roadmap

- [ ] 🔴 Исправить "Показать в дереве" из таблицы и модалок
- [ ] 🔴 Отображать все несвязанные деревья одновременно
- [ ] 🟡 Карта проживания с аватарками (Leaflet + Nominatim)
- [ ] 🟡 Поиск с живым обновлением данных
- [ ] 🟡 Экспорт дерева в PNG/SVG
- [ ] 🟢 Загрузка фото с компьютера (Base64)
- [ ] 🟢 Статистика (средний возраст, количество детей)
- [ ] 🟢 Многоязычность (RU/EN)
- [ ] ⚪ Мобильное приложение

---

## 🛠 Запуск локально

```bash
git clone https://github.com/Andreyhiitola/all_family-tree_finish.git
cd all_family-tree_finish
python -m http.server 8760
# → http://localhost:8760
```

**Дебаггинг в консоли:**
```js
window.dataManager.getPeople()
window.familyTree.findRootFamilies()
window.treeViz.render(5)
window.isAuthorized()
```
устройств. как это называется

PWA мобильное приложение:
12:54 PM
Это называется PWA (Progressive Web App) — прогрессивное веб-приложение.

По сути это обычный сайт, который можно "установить" на телефон как приложение — появляется иконка на рабочем столе, работает офлайн, нет адресной строки браузера. Выглядит и ощущается как нативное приложение, но писать отдельно ничего не нужно — просто доработка существующего проекта.

Что нужно добавить:

1. manifest.json — описание приложения для телефона:

json
{
  "name": "Family Tree",
  "short_name": "FamilyTree",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4A90D9",
  "icons": [
    { "src": "photos/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "photos/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
2. service-worker.js — кэширование для офлайн-работы:

js
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('family-tree-v1').then(cache =>
      cache.addAll(['/', '/index.html', '/style.css', '/d3.v7.min.js'])
    )
  )
})

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  )
})
3. Подключить в index.html:

html
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#4A90D9">
<meta name="apple-mobile-web-app-capable" content="yes">
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
  }
</script>
Плюсы PWA для вашего проекта:

Не нужен App Store / Google Play
Устанавливается прямо с GitHub Pages
Данные в LocalStorage сохраняются между сессиями
Работает офлайн после первого посещения
Бесплатно
Альтернативы если нужно именно нативное приложение: React Native или Flutter — но это уже отдельная кодовая база с нуля. Для вашего проекта PWA — идеальный вариант, так как всё уже написано на vanilla JS и работает в браузере.

Добавить это в PROJECT.md?
