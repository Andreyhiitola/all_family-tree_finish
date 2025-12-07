class TreeVisualizer {
  constructor({svgSelector,familyTree,onNodeClick}) {
    this.familyTree = familyTree
    this.onNodeClick = onNodeClick
    this.svg = d3.select(svgSelector)
    this.width = 1200
    this.height = 800
    this.gRoot = this.svg.append('g').attr('class','tree-root')
    this.gLinks = this.gRoot.append('g').attr('class','links')
    this.gNodes = this.gRoot.append('g').attr('class','nodes')
    this.svg.call(d3.zoom().scaleExtent([0.1,3]).on('zoom',e=>this.gRoot.attr('transform',e.transform)))
  }
  render(rootId) {
    const h = this.familyTree.buildDescendantsHierarchy(rootId)
    if (!h) return
    const tree = d3.tree().size([this.height,this.width])
    const r = tree(h)
    this.gLinks.selectAll('path').data(r.links()).join('path')
      .attr('class','link')
      .attr('d',d3.linkHorizontal().x(d=>d.y).y(d=>d.x))
    this.gNodes.selectAll('g').data(r.descendants(),d=>d.data.id).join('g')
      .attr('class','person-node')
      .attr('transform',d=>`translate(${d.y0||d.y},${d.x0||d.x})`)
      .on('click',(e,d)=>this.onNodeClick(d.data.id))
      .selectAll('circle').data([0]).join('circle')
      .attr('r',18).attr('class',d=>`node-${d.data?.gender||'male'}`)
      .selectAll('text').data([0]).join('text')
      .attr('dy',4).attr('x',24)
      .text(d=>`${d.data?.name} ${d.data?.surname}`)
  }
}
window.TreeVisualizer = TreeVisualizer
