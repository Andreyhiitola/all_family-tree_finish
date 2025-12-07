class FamilyTreeCore {
  constructor(people) { 
    this.setPeople(people || []) 
  }

  setPeople(people) {
    this.people = people || []
    console.log('🔄 FamilyTree: перестраиваем индексы для', this.people.length, 'человек')
    
    // Индекс по ID
    this.byId = new Map()
    this.people.forEach(p => this.byId.set(p.id, p))
    
    // ДЕТИ ПО РОДИТЕЛЯМ (исправлено!)
    this.childrenByParentId = new Map()
    this.people.forEach(child => {
      // Проверяем fatherId И motherId
      if (child.fatherId) {
        if (!this.childrenByParentId.has(child.fatherId)) {
          this.childrenByParentId.set(child.fatherId, [])
        }
        this.childrenByParentId.get(child.fatherId).push(child)
      }
      if (child.motherId) {
        if (!this.childrenByParentId.has(child.motherId)) {
          this.childrenByParentId.set(child.motherId, [])
        }
        this.childrenByParentId.get(child.motherId).push(child)
      }
    })
    
    console.log('👨‍👩‍👧‍👦 Найдено детей по родителям:', this.childrenByParentId.size)
    console.log('Пример для ID=1:', this.childrenByParentId.get(1) || 'нет детей')
  }

  getPersonById(id) { 
    return this.byId.get(id) 
  }

  getChildrenOf(id) { 
    const children = this.childrenByParentId.get(id) || []
    console.log('🔍 Дети ID', id, ':', children.length, 'чел.')
    return children
  }

  buildDescendantsHierarchy(rootId) {
    const root = this.getPersonById(rootId)
    if (!root) {
      console.warn('❌ Корень не найден:', rootId)
      return null
    }
    
    console.log('🌳 Строим дерево от', root.name, root.surname)
    
    const buildNode = (person) => {
      const node = {
        id: person.id,
        name: person.name,
        surname: person.surname,
        gender: person.gender,
        children: []
      }

      const children = this.getChildrenOf(person.id)
      console.log(`  👶 У ${person.name} ${person.surname} ${children.length} детей`)
      
      children.forEach(child => {
        node.children.push(buildNode(child))
      })

      if (node.children.length === 0) {
        delete node.children
      }
      return node
    }

    const tree = buildNode(root)
    console.log('✅ Дерево построено:', tree)
    
    return d3.hierarchy(tree, node => node.children || [])
  }
}
window.FamilyTreeCore = FamilyTreeCore
