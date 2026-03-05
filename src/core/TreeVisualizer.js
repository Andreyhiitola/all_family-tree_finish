class TreeVisualizer {
  constructor({svgSelector, familyTree, onNodeClick}) {
    this.familyTree = familyTree
    this.onNodeClick = onNodeClick
    this.svg = d3.select(svgSelector)
    this.width = +this.svg.attr('width') || 1200
    this.height = +this.svg.attr('height') || 800
    
    this.gRoot = this.svg.append('g').attr('class', 'tree-root')
    this.gLinks = this.gRoot.append('g').attr('class', 'links')
    this.gNodes = this.gRoot.append('g').attr('class', 'nodes')
    
    this.svg.call(d3.zoom()
      .scaleExtent([0.1, 3])
      .on('zoom', e => this.gRoot.attr('transform', e.transform))
    )
  }

  // 🎨 ГЕНЕРАЦИЯ ЦВЕТА ПО ФАМИЛИИ
  getSurnameColor(surname) {
    if (!surname) return '#999999'; // Серый для пустых фамилий
    
    // Простой хеш строки
    let hash = 0;
    for (let i = 0; i < surname.length; i++) {
      hash = surname.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Преобразуем хеш в HSL цвет
    // Hue: 0-360 (полный спектр цветов)
    const hue = Math.abs(hash % 360);
    
    // Saturation: 60-80% (яркие, но не перенасыщенные)
    const saturation = 65 + (Math.abs(hash) % 15);
    
    // Lightness будет разной для мужчин/женщин (задается отдельно)
    
    return { hue, saturation };
  }

  // 🎨 ПОЛУЧИТЬ ФИНАЛЬНЫЙ ЦВЕТ С УЧЕТОМ ПОЛА
  getPersonColor(person) {
    if (!person) return '#999999';
    
    const { hue, saturation } = this.getSurnameColor(person.surname || 'Unknown');
    
    // Мужчины: темнее (lightness 45-55%)
    // Женщины: светлее (lightness 60-70%)
    const lightness = person.gender === 'M' ? 50 : 65;
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  render(rootId) {
    const hierarchy = this.familyTree.buildDescendantsHierarchy(rootId)
    if (!hierarchy) return
    
    const treeLayout = d3.tree()
      .size([this.height - 100, this.width - 200])
      .separation((a, b) => a.parent === b.parent ? 1.2 : 1.5)
    
    const root = treeLayout(hierarchy)

    // ЛИНИИ
    this.gLinks.selectAll('path.link')
      .data(root.links())
      .join('path')
      .attr('class', 'link')
      .attr('d', d3.linkVertical()
        .x(d => d.x)
        .y(d => d.y)
      )

    // УЗЛЫ - обрабатываем разные типы
    const allNodes = this.gNodes.selectAll('g.tree-node')
      .data(root.descendants(), d => d.data.id)
      .join('g')
      .attr('class', d => `tree-node node-${d.data.type}`)
      .attr('transform', d => `translate(${d.x},${d.y})`)
    
    // Отрисовываем узлы по типам
    allNodes.each((d, i, nodes) => {
      const node = d3.select(nodes[i])
      
      if (d.data.type === 'separator') {
        // Серый кружок-разделитель
        node.selectAll('circle.separator')
          .data([d])
          .join('circle')
          .attr('class', 'separator')
          .attr('r', 12)
          .attr('fill', '#999999')
          .attr('stroke', '#666666')
          .attr('stroke-width', 2)
      } 
      else if (d.data.type === 'marriage' || d.data.type === 'family') {
        // Узел брака или семьи - рисуем пару
        this.drawPerson(node, -25, n => n.data.person1)
        
        if (d.data.person2) {
          this.drawPerson(node, 25, n => n.data.person2)
          
          // Линия брака между супругами
          node.selectAll('line.marriage-line')
            .data([d])
            .join('line')
            .attr('class', 'marriage-line')
            .attr('x1', -25)
            .attr('y1', 0)
            .attr('x2', 25)
            .attr('y2', 0)
            .attr('stroke', '#FF6B6B')
            .attr('stroke-width', 3)
        }
      }
    })
  }

  drawPerson(container, offsetX, dataAccessor) {
    const personGroup = container.selectAll(`g.person-${offsetX}`)
      .data(d => [d])
      .join('g')
      .attr('class', `person-${offsetX}`)
      .attr('transform', `translate(${offsetX}, 0)`)
      .attr('data-person-id', d => dataAccessor(d)?.id || '')
      .on('click', (event, d) => {
        const person = dataAccessor(d)
        if (person) this.onNodeClick?.(person.id)
      })

    personGroup.selectAll('rect')
      .data(d => [d])
      .join('rect')
      .attr('width', 50)
      .attr('height', 50)
      .attr('x', -25)
      .attr('y', -25)
      .attr('rx', 5)
      .attr('fill', d => {
        const person = dataAccessor(d)
        return this.getPersonColor(person) // 🎨 ИСПОЛЬЗУЕМ ЦВЕТ ПО ФАМИЛИИ
      })
      .attr('stroke', '#fff') // Белая обводка для контраста
      .attr('stroke-width', 3)
      .style('cursor', 'pointer')
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))') // Тень для объема

    personGroup.selectAll('text.name')
      .data(d => [d])
      .join('text')
      .attr('class', 'name')
      .attr('text-anchor', 'middle')
      .attr('y', -3)
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', '#FFF')
      .style('pointer-events', 'none')
      .style('text-shadow', '0 1px 2px rgba(0,0,0,0.5)') // Тень текста
      .text(d => dataAccessor(d)?.name || '')

    personGroup.selectAll('text.surname')
      .data(d => [d])
      .join('text')
      .attr('class', 'surname')
      .attr('text-anchor', 'middle')
      .attr('y', 6)
      .style('font-size', '9px')
      .style('fill', '#FFF')
      .style('pointer-events', 'none')
      .style('text-shadow', '0 1px 2px rgba(0,0,0,0.5)') // Тень текста
      .text(d => dataAccessor(d)?.surname || '')
  }
}

window.TreeVisualizer = TreeVisualizer
