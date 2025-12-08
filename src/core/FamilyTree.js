class FamilyTreeCore {
  constructor(people) { 
    this.setPeople(people || []) 
  }

  setPeople(people) {
    this.people = people || []
    console.log('🔄 FamilyTree: индексация', this.people.length, 'человек')
    
    // 1. Индекс всех людей по ID для быстрого поиска
    this.byId = new Map()
    this.people.forEach(p => this.byId.set(p.id, p))
    
    // 2. Индекс детей по родителям (Map: parentId -> [child1, child2])
    this.childrenByParentId = new Map()

    this.people.forEach(child => {
      // Собираем всех родителей ребенка (отец + мать), исключая null/0
      const parentIds = [child.fatherId, child.motherId].filter(pid => pid)

      parentIds.forEach(parentId => {
        // ВАЖНО: Проверяем, существует ли такой родитель в базе вообще?
        // Это защищает от "битых" ссылок, когда fatherId=999, а человека 999 нет.
        if (this.byId.has(parentId)) {
            if (!this.childrenByParentId.has(parentId)) {
                this.childrenByParentId.set(parentId, [])
            }
            // Добавляем ребенка в список этого родителя
            // (можно добавить проверку на дубликаты, но обычно не требуется)
            this.childrenByParentId.get(parentId).push(child)
        }
      })
    })
    
    console.log('👨‍👩‍👧‍👦 Индекс связей построен. Родителей с детьми:', this.childrenByParentId.size)
  }

  getPersonById(id) { 
    return this.byId.get(id) 
  }

  getChildrenOf(id) { 
    // Возвращаем массив детей или пустой массив
    return this.childrenByParentId.get(id) || []
  }

  buildDescendantsHierarchy(rootId) {
    const root = this.getPersonById(rootId)
    if (!root) {
      console.warn('❌ Корень не найден в индексе:', rootId)
      return null
    }
    
    // Рекурсивная функция построения
    const buildNode = (person, depth) => {
      // Защита от бесконечной рекурсии (если кто-то указал отца своим сыном)
      if (depth > 50) {
          console.error('⚠️ Обнаружен цикл или слишком большая вложенность!', person)
          return { id: person.id, name: person.name, _error: 'cycle' }
      }

      const node = {
        id: person.id,
        name: person.name,
        surname: person.surname,
        gender: person.gender,
        children: []
      }

      const children = this.getChildrenOf(person.id)
      
      // Сортируем детей по дате рождения (если есть), чтобы дерево было красивее
      children.sort((a, b) => (a.birthDate || '9999') > (b.birthDate || '9999') ? 1 : -1)

      children.forEach(child => {
        node.children.push(buildNode(child, depth + 1))
      })

      if (node.children.length === 0) {
        delete node.children
      }
      return node
    }

    console.log(`🌳 Строим дерево потомков для: ${root.name} ${root.surname} (ID: ${root.id})`)
    const treeData = buildNode(root, 0)
    
    // Превращаем в D3 иерархию
    return d3.hierarchy(treeData, d => d.children || [])
  }
}
window.FamilyTreeCore = FamilyTreeCore
