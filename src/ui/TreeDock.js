/**
 * TreeDock.js — панель быстрого переключения деревьев
 * Hover на карточку → каскадный попап с деревом 3 поколений
 */
class TreeDock {
  constructor({ familyTree, onSelectTree }) {
    this.familyTree = familyTree
    this.onSelectTree = onSelectTree
    this.activeId = null
    this.container = null
    this._hoverTimer = null
    this._popup = null
  }

  /** Смонтировать панель в DOM */
  mount() {
    document.getElementById('tree-dock')?.remove()
    document.getElementById('dock-popup')?.remove()

    const dock = document.createElement('div')
    dock.id = 'tree-dock'
    dock.innerHTML = `
      <div class="dock-header">
        <span class="dock-title">🌳</span>
        <span class="dock-title-full">Деревья</span>
        <button class="dock-toggle" id="dock-toggle" title="Свернуть">◀</button>
      </div>
      <div class="dock-scroll" id="dock-scroll"></div>
    `
    document.body.appendChild(dock)

    // Попап — один на весь dock, позиционируется динамически
    const popup = document.createElement('div')
    popup.id = 'dock-popup'
    popup.className = 'dock-popup'
    popup.innerHTML = `
      <div class="dock-popup-header">
        <span class="dock-popup-title"></span>
        <span class="dock-popup-count"></span>
      </div>
      <div class="dock-popup-svg-wrap">
        <svg class="dock-popup-svg" xmlns="http://www.w3.org/2000/svg"></svg>
      </div>
      <div class="dock-popup-hint">Клик — открыть дерево</div>
    `
    document.body.appendChild(popup)
    this._popup = popup

    this.container = dock.querySelector('#dock-scroll')

    dock.querySelector('#dock-toggle').addEventListener('click', () => {
      dock.classList.toggle('collapsed')
      dock.querySelector('#dock-toggle').textContent =
        dock.classList.contains('collapsed') ? '▶' : '◀'
    })

    // Скрываем попап при уходе курсора
    dock.addEventListener('mouseleave', () => {
      clearTimeout(this._hoverTimer)
      this._hoverTimer = setTimeout(() => this._hidePopup(), 200)
    })
    popup.addEventListener('mouseenter', () => clearTimeout(this._hoverTimer))
    popup.addEventListener('mouseleave', () => {
      clearTimeout(this._hoverTimer)
      this._hoverTimer = setTimeout(() => this._hidePopup(), 150)
    })

    this.refresh()
  }

  /** Перерисовать все карточки */
  refresh() {
    if (!this.container) return
    const families = this.familyTree.findRootFamilies()
    this.container.innerHTML = ''
    families.forEach((family, index) => {
      this.container.appendChild(this._createCard(family, index))
    })
  }

  /** Создать карточку одного дерева */
  _createCard(family, index) {
    const card = document.createElement('div')
    card.className = 'dock-card'
    card.dataset.id = family.id
    if (family.id === this.activeId) card.classList.add('active')

    const color1 = this._getPersonColor(family.person1)
    const color2 = family.person2 ? this._getPersonColor(family.person2) : null
    const count = this._countDescendants(family.id)
    const label = this._shortLabel(family)

    card.innerHTML = `
      <div class="dock-card-num">${index + 1}</div>
      <div class="dock-card-preview">
        <svg viewBox="-42 -22 84 50" xmlns="http://www.w3.org/2000/svg">
          ${this._buildMiniSvg(family, color1, color2)}
        </svg>
      </div>
      <div class="dock-card-info">
        <div class="dock-card-name">${label}</div>
        <div class="dock-card-count">${count} чел.</div>
      </div>
    `

    card.addEventListener('click', () => this.select(family.id))
    card.title = ''

    card.addEventListener('mouseenter', () => {
      clearTimeout(this._hoverTimer)
      this._hoverTimer = setTimeout(() => {
        this._showPopup(family, card, color1, color2, count)
      }, 200)
    })
    card.addEventListener('mouseleave', () => {
      clearTimeout(this._hoverTimer)
      this._hoverTimer = setTimeout(() => this._hidePopup(), 150)
    })

    return card
  }

  /** Показать каскадный попап справа от dock */
  _showPopup(family, card, color1, color2, count) {
    const popup = this._popup
    if (!popup) return

    // Заголовок
    popup.querySelector('.dock-popup-title').textContent = family.label
    popup.querySelector('.dock-popup-count').textContent = `${count} человек`

    // Строим SVG дерева
    const treeData = this._buildExpandedTree(family)
    const svg = popup.querySelector('.dock-popup-svg')
    const { svgContent, viewBox } = this._renderExpandedSvg(treeData, color1, color2)
    svg.setAttribute('viewBox', viewBox)
    svg.innerHTML = svgContent

    // Позиционируем попап
    const dockEl = document.getElementById('tree-dock')
    const dockRect = dockEl.getBoundingClientRect()
    const cardRect = card.getBoundingClientRect()
    const popupH = 300

    let top = cardRect.top + cardRect.height / 2 - popupH / 2
    top = Math.max(8, Math.min(top, window.innerHeight - popupH - 8))

    popup.style.top = top + 'px'
    popup.style.left = (dockRect.right + 10) + 'px'
    popup.classList.add('visible')
  }

  /** Скрыть попап */
  _hidePopup() {
    this._popup?.classList.remove('visible')
  }

  /**
   * Построить данные расширенного дерева (3 поколения)
   */
  _buildExpandedTree(family) {
    const nodes = []
    const links = []

    // Поколение 0 — корневая пара
    nodes.push({
      id: 'root',
      x: 0, y: 0,
      person1: family.person1,
      person2: family.person2 || null,
      level: 0
    })

    // Поколение 1 — дети
    const children = this.familyTree.getChildrenOfCouple(
      family.person1.id,
      family.person2?.id
    )
    const visibleChildren = children.slice(0, 7)
    const childSpacing = 88
    const childStartX = -(visibleChildren.length - 1) * childSpacing / 2

    visibleChildren.forEach((child, i) => {
      const cid = `c${i}`
      const cx = childStartX + i * childSpacing
      nodes.push({ id: cid, x: cx, y: 95, person1: child, person2: null, level: 1 })
      links.push({ from: 'root', to: cid })

      // Поколение 2 — внуки
      const grandchildren = this.familyTree.getChildrenOf(child.id)
      const visibleGc = grandchildren.slice(0, 3)
      const gcSpacing = 42
      const gcStartX = cx - (visibleGc.length - 1) * gcSpacing / 2

      visibleGc.forEach((gc, j) => {
        const gcid = `g${i}_${j}`
        nodes.push({ id: gcid, x: gcStartX + j * gcSpacing, y: 180, person1: gc, person2: null, level: 2 })
        links.push({ from: cid, to: gcid })
      })
    })

    return { nodes, links }
  }

  /**
   * Рендерить расширенное SVG-дерево
   */
  _renderExpandedSvg(treeData, color1, color2) {
    const { nodes, links } = treeData

    // Bounding box
    const allX = nodes.flatMap(n => [n.x - 55, n.x + 55])
    const allY = nodes.flatMap(n => [n.y - 25, n.y + 35])
    const minX = Math.min(...allX)
    const maxX = Math.max(...allX)
    const minY = Math.min(...allY)
    const maxY = Math.max(...allY)
    const viewBox = `${minX} ${minY} ${maxX - minX} ${maxY - minY}`

    let html = ''

    // Связующие линии (красивые кривые Безье)
    links.forEach(link => {
      const from = nodes.find(n => n.id === link.from)
      const to = nodes.find(n => n.id === link.to)
      if (!from || !to) return
      const fy = from.y + (from.level === 0 ? 16 : 14)
      const ty = to.y - 14
      const my = (fy + ty) / 2
      html += `<path d="M${from.x},${fy} C${from.x},${my} ${to.x},${my} ${to.x},${ty}"
        fill="none" stroke="#c9a96e" stroke-width="1.5" opacity="0.55"/>`
    })

    // Узлы
    nodes.forEach(({ x, y, person1, person2, level }) => {
      const rw = level === 0 ? 48 : level === 1 ? 42 : 34
      const rh = level === 0 ? 32 : level === 1 ? 28 : 22
      const fs = level === 0 ? 9 : level === 1 ? 8 : 6.5
      const c1 = level === 0 ? color1 : this._getPersonColor(person1)
      const dead = person1.deathDate ? true : false
      const opacity = dead ? 0.55 : 0.9

      if (person2 && level === 0) {
        const c2 = color2 || c1
        const gap = 30
        html += `
          <rect x="${x - gap - rw/2}" y="${y - rh/2}" width="${rw}" height="${rh}" rx="5" fill="${c1}" opacity="${opacity}"/>
          <rect x="${x + gap - rw/2}" y="${y - rh/2}" width="${rw}" height="${rh}" rx="5" fill="${c2}" opacity="${opacity}"/>
          <line x1="${x - gap + rw/2}" y1="${y}" x2="${x + gap - rw/2}" y2="${y}" stroke="#c9a96e" stroke-width="2.5"/>
          <circle cx="${x - gap + rw/2}" cy="${y}" r="3" fill="#c9a96e"/>
          <circle cx="${x + gap - rw/2}" cy="${y}" r="3" fill="#c9a96e"/>
          <text x="${x - gap}" y="${y + 3}" text-anchor="middle" fill="white" font-size="${fs}" font-weight="bold" font-family="sans-serif">${(person1.name||'?').slice(0,5)}</text>
          <text x="${x + gap}" y="${y + 3}" text-anchor="middle" fill="white" font-size="${fs}" font-weight="bold" font-family="sans-serif">${(person2.name||'?').slice(0,5)}</text>
        `
      } else {
        html += `
          <rect x="${x - rw/2}" y="${y - rh/2}" width="${rw}" height="${rh}" rx="4"
            fill="${c1}" opacity="${opacity}"
            ${dead ? 'stroke="#aaa" stroke-width="1" stroke-dasharray="3,2"' : ''}/>
          <text x="${x}" y="${y + fs/2 - 1}" text-anchor="middle" fill="white" font-size="${fs}" font-weight="bold" font-family="sans-serif">${(person1.name||'?').slice(0, level === 2 ? 5 : 6)}</text>
          ${person1.birthDate && level < 2 ? `<text x="${x}" y="${y + rh/2 + 9}" text-anchor="middle" fill="#c9a96e" font-size="5.5" font-family="sans-serif" opacity="0.85">${String(person1.birthDate).slice(0,4)}</text>` : ''}
        `
      }
    })

    return { svgContent: html, viewBox }
  }

  /** SVG-миниатюра для карточки (маленькая) */
  _buildMiniSvg(family, color1, color2) {
    if (color2) {
      return `
        <rect x="-40" y="-18" width="30" height="22" rx="4" fill="${color1}"/>
        <rect x="10" y="-18" width="30" height="22" rx="4" fill="${color2}"/>
        <line x1="-10" y1="-7" x2="10" y2="-7" stroke="#c9a96e" stroke-width="2.5"/>
        <circle cx="-10" cy="-7" r="2.5" fill="#c9a96e"/>
        <circle cx="10" cy="-7" r="2.5" fill="#c9a96e"/>
        <text x="-25" y="-3" text-anchor="middle" fill="white" font-size="7.5" font-weight="bold" font-family="sans-serif">${(family.person1.name || '?').slice(0,4)}</text>
        <text x="25" y="-3" text-anchor="middle" fill="white" font-size="7.5" font-weight="bold" font-family="sans-serif">${(family.person2.name || '?').slice(0,4)}</text>
        <line x1="0" y1="4" x2="0" y2="14" stroke="#a0856a" stroke-width="1.5"/>
        <line x1="-18" y1="14" x2="18" y2="14" stroke="#a0856a" stroke-width="1.5"/>
        <rect x="-25" y="14" width="14" height="9" rx="2" fill="${color1}" opacity="0.65"/>
        <rect x="-7" y="14" width="14" height="9" rx="2" fill="${color2}" opacity="0.65"/>
        <rect x="11" y="14" width="14" height="9" rx="2" fill="${color1}" opacity="0.45"/>
      `
    }
    return `
      <rect x="-18" y="-18" width="36" height="24" rx="4" fill="${color1}"/>
      <text x="0" y="-3" text-anchor="middle" fill="white" font-size="8" font-weight="bold" font-family="sans-serif">${(family.person1.name || '?').slice(0,5)}</text>
      <line x1="0" y1="6" x2="0" y2="16" stroke="#a0856a" stroke-width="1.5"/>
      <line x1="-16" y1="16" x2="16" y2="16" stroke="#a0856a" stroke-width="1.5"/>
      <rect x="-22" y="16" width="13" height="9" rx="2" fill="${color1}" opacity="0.65"/>
      <rect x="9" y="16" width="13" height="9" rx="2" fill="${color1}" opacity="0.45"/>
    `
  }

  /** Выбрать дерево */
  select(id) {
    this.activeId = id
    this._hidePopup()
    this.container?.querySelectorAll('.dock-card').forEach(card => {
      card.classList.toggle('active', +card.dataset.id === id)
    })
    this.onSelectTree(id)
  }

  /** Количество людей в ветке */
  _countDescendants(rootId) {
    const visited = new Set()
    const queue = [rootId]
    while (queue.length) {
      const id = queue.shift()
      if (visited.has(id)) continue
      visited.add(id)
      const p = this.familyTree.getPersonById(id)
      if (!p) continue
      if (p.spouseId && !visited.has(p.spouseId)) queue.push(p.spouseId)
      this.familyTree.getChildrenOf(id).forEach(c => {
        if (!visited.has(c.id)) queue.push(c.id)
      })
    }
    return visited.size
  }

  /** Короткий лейбл */
  _shortLabel(family) {
    const p = family.person1
    const surname = (p.surname || '').split(' ')[0].replace(/\(.*\)/, '').trim()
    if (family.person2) return surname || p.name
    return `${p.name} ${surname}`.trim()
  }

  /** Цвет по фамилии */
  _getPersonColor(person) {
    if (!person) return '#999'
    const s = person.surname || 'Unknown'
    let hash = 0
    for (let i = 0; i < s.length; i++) {
      hash = s.charCodeAt(i) + ((hash << 5) - hash)
      hash = hash & hash
    }
    const hue = Math.abs(hash % 360)
    const sat = 65 + (Math.abs(hash) % 15)
    const lig = person.gender === 'M' ? 50 : 65
    return `hsl(${hue}, ${sat}%, ${lig}%)`
  }
}

window.TreeDock = TreeDock
