class TreeVisualizer {
  constructor({svgSelector,familyTree,onNodeClick}) {
    this.familyTree = familyTree
    this.onNodeClick = onNodeClick
    this.svg = d3.select(svgSelector)
    this.width = +this.svg.attr('width') || 1200
    this.height = +this.svg.attr('height') || 800
    
    this.gRoot = this.svg.append('g').attr('class','tree-root')
    this.gLinks = this.gRoot.append('g').attr('class','links')
    this.gNodes = this.gRoot.append('g').attr('class','nodes')
    
    // Зум
    this.svg.call(d3.zoom()
      .scaleExtent([0.1, 3])
      .on('zoom', e => this.gRoot.attr('transform', e.transform))
    )
  }

  render(rootId) {
    const hierarchy = this.familyTree.buildDescendantsHierarchy(rootId)
    if (!hierarchy) return
    
    const treeLayout = d3.tree().size([this.height-100, this.width-200])
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

    // ✅ УЗЛЫ С ФИО В КРУЖКЕ
    const nodeGroups = this.gNodes.selectAll('g.person-node')
      .data(root.descendants(), d => d.data.id)
      .join('g')
      .attr('class', 'person-node')
      .attr('transform', d => `translate(${d.y},${d.x})`)
      .on('click', (event, d) => this.onNodeClick?.(d.data.id))
      .on('mouseenter', function(event, d) {
        d3.select(this).classed('node-hover', true)
      })
      .on('mouseleave', function() {
        d3.select(this).classed('node-hover', false)
      })

    // КРУЖОК
    nodeGroups.selectAll('circle')
      .data(d => [d])
      .join('circle')
      .attr('r', 28)  // Увеличили радиус под ФИО
      .attr('class', d => `node node-${d.data.gender || 'male'}`)
      .attr('fill', d => d.data.gender === 'M' ? '#4A90E2' : '#E91E63')  // Синий для М, розовый для Ж
      .attr('stroke', '#333')
      .attr('stroke-width', 2)


    // ✅ ФИО В КРУЖКЕ (2 строки)
    nodeGroups.selectAll('text.name')
      .data(d => [d])
      .join('text')
      .attr('class', 'name')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('y', -4)
      .style('font-weight', 'bold')
      .style('font-size', '11px')
      .text(d => d.data.name || '')

    nodeGroups.selectAll('text.surname')
      .data(d => [d])
      .join('text')
      .attr('class', 'surname')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('y', 6)
      .style('font-size', '10px')
      .text(d => d.data.surname || '')

    // ID снизу (маленький)
    nodeGroups.selectAll('text.id')
      .data(d => [d])
      .join('text')
      .attr('class', 'id')
      .attr('text-anchor', 'middle')
      .attr('y', 22)
      .style('font-size', '8px')
      .style('fill', '#666')
      .text(d => `#${d.data.id}`)
  }
}
window.TreeVisualizer = TreeVisualizer
