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
      .attr('d', d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x)
      )

    // УЗЛЫ (семейные пары)
    const familyGroups = this.gNodes.selectAll('g.family-node')
      .data(root.descendants(), d => d.data.id)
      .join('g')
      .attr('class', 'family-node')
      .attr('transform', d => `translate(${d.y},${d.x})`)

    // Рисуем первого человека (основной)
    this.drawPerson(familyGroups, -25, d => d.data.person1)

    // Рисуем супруга (если есть)
    familyGroups.each((d, i, nodes) => {
      if (d.data.person2) {
        this.drawPerson(d3.select(nodes[i]), 25, node => node.data.person2)
        
        // Линия брака между супругами
        d3.select(nodes[i])
          .selectAll('line.marriage-line')
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
    })
  }

  drawPerson(container, offsetX, dataAccessor) {
    const personGroup = container.selectAll(`g.person-${offsetX}`)
      .data(d => [d])
      .join('g')
      .attr('class', `person-${offsetX}`)
      .attr('transform', `translate(${offsetX}, 0)`)
      .on('click', (event, d) => {
        const person = dataAccessor(d)
        if (person) this.onNodeClick?.(person.id)
      })

    personGroup.selectAll('circle')
      .data(d => [d])
      .join('circle')
      .attr('r', 25)
      .attr('fill', d => {
        const person = dataAccessor(d)
        return person.gender === 'M' ? '#4A90E2' : '#E91E63'
      })
      .attr('stroke', '#333')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')

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
      .text(d => dataAccessor(d)?.surname || '')
  }
}

window.TreeVisualizer = TreeVisualizer
