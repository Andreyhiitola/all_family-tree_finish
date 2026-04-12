class TreeVisualizer {
  constructor({svgSelector, familyTree, onNodeClick}) {
    this.familyTree = familyTree
    this.onNodeClick = onNodeClick
    this.svg = d3.select(svgSelector)
    this.width = +this.svg.attr('width') || 1200
    this.height = +this.svg.attr('height') || 800

    this.defs = this.svg.append('defs')
    this._clipPathsCreated = new Set()
    this._addDefs()

    // Subtle background
    this.svg.append('rect')
      .attr('width', '100%').attr('height', '100%')
      .attr('fill', 'url(#treeBg)')

    this.gRoot = this.svg.append('g').attr('class', 'tree-root')
    this.gLinks = this.gRoot.append('g').attr('class', 'links')
    this.gSurnameLinks = this.gRoot.append('g').attr('class', 'surname-links')
    this.gNodes = this.gRoot.append('g').attr('class', 'nodes')

    this.svg.call(
      d3.zoom().scaleExtent([0.05, 3])
        .on('zoom', e => this.gRoot.attr('transform', e.transform))
    )

    this.surnameLinksVisible = false
    this.allTreesMode = false
    this.personPositions = new Map()
  }

  _addDefs() {
    // Background gradient
    const bg = this.defs.append('linearGradient')
      .attr('id', 'treeBg').attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '100%')
    bg.append('stop').attr('offset', '0%').attr('stop-color', '#f7f2ea')
    bg.append('stop').attr('offset', '100%').attr('stop-color', '#ede6d7')

    // Card shadow
    const f1 = this.defs.append('filter').attr('id', 'card-shadow')
      .attr('x', '-25%').attr('y', '-25%').attr('width', '150%').attr('height', '150%')
    f1.append('feDropShadow')
      .attr('dx', '0').attr('dy', '3').attr('stdDeviation', '5')
      .attr('flood-color', 'rgba(0,0,0,0.18)')

    // Card shadow hover
    const f2 = this.defs.append('filter').attr('id', 'card-shadow-hover')
      .attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%')
    f2.append('feDropShadow')
      .attr('dx', '0').attr('dy', '6').attr('stdDeviation', '10')
      .attr('flood-color', 'rgba(0,0,0,0.28)')
  }

  // ── Цвета по фамилии ───────────────────────────────────────────────────────

  _surnameHash(surname) {
    if (!surname) return { hue: 0, sat: 30 }
    let hash = 0
    for (let i = 0; i < surname.length; i++) {
      hash = surname.charCodeAt(i) + ((hash << 5) - hash)
      hash = hash & hash
    }
    return { hue: Math.abs(hash % 360), sat: 62 + Math.abs(hash) % 16 }
  }

  getPersonColor(person) {
    if (!person) return '#999'
    const { hue, sat } = this._surnameHash(person.surname)
    const l = person.gender === 'M' ? 40 : 55
    return `hsl(${hue},${sat}%,${l}%)`
  }

  getPersonColorLight(person) {
    if (!person) return '#eee'
    const { hue, sat } = this._surnameHash(person.surname)
    return `hsl(${hue},${sat - 15}%,94%)`
  }

  // ── ClipPath для круглого фото ────────────────────────────────────────────

  _ensureClipPath(personId) {
    const id = `pclip-${personId}`
    if (!this._clipPathsCreated.has(id)) {
      this.defs.append('clipPath').attr('id', id)
        .append('circle').attr('cx', 0).attr('cy', -20).attr('r', 26)
      this._clipPathsCreated.add(id)
    }
    return id
  }

  _preCreateClipPaths(root) {
    root.descendants().forEach(d => {
      ;[d.data.person1, d.data.person2, d.data.person].forEach(p => {
        if (p?.id) this._ensureClipPath(p.id)
      })
    })
  }

  // ── Основной рендер одного дерева ─────────────────────────────────────────

  render(rootId) {
    this.allTreesMode = false
    this.currentRootId = rootId
    const hierarchy = this.familyTree.buildDescendantsHierarchy(rootId)
    if (!hierarchy) return

    this._preCreateClipPaths(hierarchy)

    const layout = d3.tree().nodeSize([270, 220])
      .separation((a, b) => a.parent === b.parent ? 1.1 : 1.5)
    const root = layout(hierarchy)

    this._clear()
    this.personPositions.clear()
    this._renderTree(root, 0, 0)

    if (this.surnameLinksVisible) this._drawSurnameLinks()
  }

  // ── Режим: все деревья рядом ──────────────────────────────────────────────

  renderAll() {
    this.allTreesMode = true
    const families = this.familyTree.findRootFamilies()
    if (!families.length) return

    const layout = d3.tree().nodeSize([270, 220])
      .separation((a, b) => a.parent === b.parent ? 1.1 : 1.5)

    // Pre-create clip paths for all trees
    families.forEach(f => {
      const h = this.familyTree.buildDescendantsHierarchy(f.id)
      if (h) this._preCreateClipPaths(h)
    })

    this._clear()
    this.personPositions.clear()

    let xOffset = 200
    const GAP = 600

    families.forEach(f => {
      const hierarchy = this.familyTree.buildDescendantsHierarchy(f.id)
      if (!hierarchy) return

      const root = layout(hierarchy)
      const nodes = root.descendants()
      const minX = Math.min(...nodes.map(n => n.x))
      const maxX = Math.max(...nodes.map(n => n.x))

      const shift = xOffset - minX
      this._renderTree(root, shift, 80)

      // Label for this tree root
      const label = `${f.person1.name} ${f.person1.surname}`
      this.gNodes.append('text')
        .attr('x', (minX + maxX) / 2 + shift)
        .attr('y', 40)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .attr('fill', '#6b4f3a')
        .attr('opacity', 0.7)
        .text(label)

      xOffset += (maxX - minX) + GAP
    })

    if (this.surnameLinksVisible) this._drawSurnameLinks()
  }

  // ── Внутренний рендер дерева со сдвигом ──────────────────────────────────

  _renderTree(root, xShift, yShift) {
    // Записываем позиции людей для surname links
    root.descendants().forEach(d => {
      const ax = d.x + xShift
      const ay = d.y + yShift
      if (d.data.person1?.id) this.personPositions.set(d.data.person1.id, { x: ax - 65, y: ay })
      if (d.data.person2?.id) this.personPositions.set(d.data.person2.id, { x: ax + 65, y: ay })
      if (d.data.person?.id)  this.personPositions.set(d.data.person.id,  { x: ax, y: ay })
    })

    // Линии связей
    this.gLinks.selectAll(null)
      .data(root.links())
      .enter().append('path')
      .attr('class', 'link')
      .attr('d', d3.linkVertical()
        .x(d => d.x + xShift)
        .y(d => d.y + yShift)
      )
      .attr('fill', 'none')
      .attr('stroke', '#c4b29a')
      .attr('stroke-width', 2)
      .attr('stroke-linecap', 'round')

    // Узлы
    root.descendants().forEach(d => {
      const g = this.gNodes.append('g')
        .attr('class', `tree-node node-${d.data.type}`)
        .attr('transform', `translate(${d.x + xShift},${d.y + yShift})`)

      if (d.data.type === 'separator') {
        this._drawCard(g, 0, d.data.person)
        // Маркер "несколько браков"
        g.append('circle').attr('cx', 42).attr('cy', -50)
          .attr('r', 9).attr('fill', '#c9a96e').attr('stroke', '#fff').attr('stroke-width', 2)
        g.append('text').attr('x', 42).attr('y', -46)
          .attr('text-anchor', 'middle').attr('font-size', '10px').attr('fill', '#fff')
          .style('pointer-events', 'none').text('★')
      } else {
        if (d.data.person1) this._drawCard(g, -65, d.data.person1)
        if (d.data.person2) {
          this._drawCard(g, 65, d.data.person2)
          // Соединительная линия брака
          g.append('line')
            .attr('x1', -12).attr('y1', 0).attr('x2', 12).attr('y2', 0)
            .attr('stroke', '#e08090').attr('stroke-width', 2)
          g.append('text').attr('text-anchor', 'middle').attr('y', 5)
            .attr('font-size', '13px').attr('fill', '#e08090')
            .style('pointer-events', 'none').text('♥')
        }
      }
    })
  }

  _clear() {
    this.gLinks.selectAll('*').remove()
    this.gNodes.selectAll('*').remove()
    this.gSurnameLinks.selectAll('*').remove()
  }

  // ── Карточка человека ─────────────────────────────────────────────────────

  _drawCard(container, offsetX, person) {
    if (!person) return

    const W = 104, H = 124
    const PR = 26    // photo radius
    const PCY = -20  // photo center Y относительно центра карточки

    const g = container.append('g')
      .attr('class', 'person-card')
      .attr('transform', `translate(${offsetX},0)`)
      .style('cursor', 'pointer')
      .on('click', () => this.onNodeClick?.(person.id))
      .on('mouseenter', function() {
        d3.select(this).select('.card-bg')
          .transition().duration(130)
          .attr('filter', 'url(#card-shadow-hover)')
          .attr('stroke-width', 2.5)
      })
      .on('mouseleave', function() {
        d3.select(this).select('.card-bg')
          .transition().duration(130)
          .attr('filter', 'url(#card-shadow)')
          .attr('stroke-width', 2)
      })

    // Фон карточки
    g.append('rect').attr('class', 'card-bg')
      .attr('x', -W / 2).attr('y', -H / 2)
      .attr('width', W).attr('height', H)
      .attr('rx', 14).attr('ry', 14)
      .attr('fill', this.getPersonColorLight(person))
      .attr('stroke', this.getPersonColor(person))
      .attr('stroke-width', 2)
      .attr('filter', 'url(#card-shadow)')

    // Цветной кружок-подложка фото
    g.append('circle')
      .attr('cx', 0).attr('cy', PCY).attr('r', PR + 3)
      .attr('fill', this.getPersonColor(person))
      .style('pointer-events', 'none')

    // Фото
    const clipId = this._ensureClipPath(person.id)
    const defaultUrl = window.dataManager
      ? window.dataManager.getPhotoUrl('default-avatar.png') : ''
    const photoUrl = (person.photo && window.dataManager)
      ? window.dataManager.getPhotoUrl(person.photo) : defaultUrl

    const img = g.append('image')
      .attr('x', -PR).attr('y', PCY - PR)
      .attr('width', PR * 2).attr('height', PR * 2)
      .attr('clip-path', `url(#${clipId})`)
      .attr('preserveAspectRatio', 'xMidYMid slice')
      .attr('href', photoUrl)
      .style('pointer-events', 'none')

    // Fallback если фото не загрузилось
    img.on('error', function() {
      d3.select(this).attr('href', defaultUrl)
      d3.select(this).on('error', null)
    })

    // Белая рамка вокруг фото
    g.append('circle')
      .attr('cx', 0).attr('cy', PCY).attr('r', PR)
      .attr('fill', 'none')
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .style('pointer-events', 'none')

    // Имя
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', PCY + PR + 17)
      .attr('font-size', '11px').attr('font-weight', '700')
      .attr('fill', '#2c2020')
      .style('pointer-events', 'none')
      .text(person.name || '')

    // Фамилия
    const sn = (person.surname || '')
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', PCY + PR + 31)
      .attr('font-size', '10px')
      .attr('fill', '#4a3a3a')
      .style('pointer-events', 'none')
      .text(sn.length > 14 ? sn.slice(0, 12) + '…' : sn)

    // Год рождения
    if (person.birthDate) {
      const yr = new Date(person.birthDate).getFullYear()
      if (!isNaN(yr)) {
        g.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', PCY + PR + 46)
          .attr('font-size', '9px')
          .attr('fill', '#888')
          .style('pointer-events', 'none')
          .text(yr)
      }
    }
  }

  // ── Связи по фамилиям ─────────────────────────────────────────────────────

  _drawSurnameLinks() {
    this.gSurnameLinks.selectAll('*').remove()

    const bySurname = new Map()
    this.familyTree.people.forEach(p => {
      if (!p.surname || !this.personPositions.has(p.id)) return
      const key = p.surname.trim().toLowerCase()
      if (!bySurname.has(key)) bySurname.set(key, [])
      bySurname.get(key).push({ person: p, pos: this.personPositions.get(p.id) })
    })

    bySurname.forEach((entries) => {
      if (entries.length < 2) return

      const { hue, sat } = this._surnameHash(entries[0].person.surname)
      const color = `hsl(${hue},${sat}%,45%)`

      // Соединяем все пары с достаточным расстоянием
      for (let i = 0; i < entries.length - 1; i++) {
        for (let j = i + 1; j < entries.length; j++) {
          const a = entries[i].pos
          const b = entries[j].pos
          const dist = Math.hypot(a.x - b.x, a.y - b.y)
          if (dist < 180) continue // слишком близко — одна семья

          const midX = (a.x + b.x) / 2
          const midY = Math.min(a.y, b.y) - Math.max(100, dist * 0.3)

          this.gSurnameLinks.append('path')
            .attr('d', `M${a.x},${a.y} Q${midX},${midY} ${b.x},${b.y}`)
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', 1.8)
            .attr('stroke-dasharray', '7,5')
            .attr('opacity', 0.55)
        }
      }
    })
  }

  toggleSurnameLinks() {
    this.surnameLinksVisible = !this.surnameLinksVisible
    if (this.surnameLinksVisible) {
      this._drawSurnameLinks()
    } else {
      this.gSurnameLinks.selectAll('*').remove()
    }
    return this.surnameLinksVisible
  }
}

window.TreeVisualizer = TreeVisualizer
