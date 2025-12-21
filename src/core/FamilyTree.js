class FamilyTree {
  constructor(people) { 
    this.setPeople(people || []) 
  }

  setPeople(people) {
    this.people = people || []
    console.log('🔄 FamilyTree: индексация', this.people.length, 'человек')
    
    this.byId = new Map()
    this.people.forEach(p => this.byId.set(p.id, p))
    
    this.childrenByParentId = new Map()

    this.people.forEach(child => {
      const parentIds = [child.fatherId, child.motherId].filter(pid => pid)

      parentIds.forEach(parentId => {
        if (this.byId.has(parentId)) {
            if (!this.childrenByParentId.has(parentId)) {
                this.childrenByParentId.set(parentId, [])
            }
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
    return this.childrenByParentId.get(id) || []
  }

  getChildrenOfCouple(person1Id, person2Id) {
    const children1 = this.getChildrenOf(person1Id)
    
    if (!person2Id) {
      return children1
    }
    
    // Возвращаем ТОЛЬКО общих детей (у которых оба родителя совпадают)
    return children1.filter(child => {
      return (child.fatherId === person1Id && child.motherId === person2Id) ||
             (child.fatherId === person2Id && child.motherId === person1Id)
    })
  }

  buildDescendantsHierarchy(rootId) {
    const root = this.getPersonById(rootId)
    if (!root) {
      console.warn('❌ Корень не найден в индексе:', rootId)
      return null
    }

    console.log(`🌳 Строим семейное дерево от: ${root.name} ${root.surname} (ID: ${root.id})`)

    const processedPeople = new Set()

    const buildFamilyNode = (person, depth) => {
      if (depth > 50 || processedPeople.has(person.id)) {
        return null
      }

      processedPeople.add(person.id)

      const spouses = this.getSpouses(person.id)
      
      spouses.forEach(s => processedPeople.add(s.id))

      if (spouses.length === 0) {
        const children = this.getChildrenOf(person.id)
        
        const familyNode = {
          type: 'family',
          id: `family-${person.id}`,
          person1: {
            id: person.id,
            name: person.name,
            surname: person.surname,
            gender: person.gender
          },
          person2: null,
          children: []
        }

        children.sort((a, b) => (a.birthDate || '9999') > (b.birthDate || '9999') ? 1 : -1)

        children.forEach(child => {
          const childNode = buildFamilyNode(child, depth + 1)
          if (childNode) familyNode.children.push(childNode)
        })

        if (familyNode.children.length === 0) delete familyNode.children
        return familyNode
      }

      if (spouses.length === 1) {
        const spouse = spouses[0]
        const children = this.getChildrenOfCouple(person.id, spouse.id)

        const familyNode = {
          type: 'family',
          id: `family-${person.id}-${spouse.id}`,
          person1: {
            id: person.id,
            name: person.name,
            surname: person.surname,
            gender: person.gender
          },
          person2: {
            id: spouse.id,
            name: spouse.name,
            surname: spouse.surname,
            gender: spouse.gender
          },
          children: []
        }

        children.sort((a, b) => (a.birthDate || '9999') > (b.birthDate || '9999') ? 1 : -1)

        children.forEach(child => {
          const childNode = buildFamilyNode(child, depth + 1)
          if (childNode) familyNode.children.push(childNode)
        })

        if (familyNode.children.length === 0) delete familyNode.children
        return familyNode
      }

      const marriages = spouses.map(spouse => {
        const children = this.getChildrenOfCouple(person.id, spouse.id)

        const marriageNode = {
          type: 'family',
          id: `family-${person.id}-${spouse.id}`,
          person1: {
            id: person.id,
            name: person.name,
            surname: person.surname,
            gender: person.gender
          },
          person2: {
            id: spouse.id,
            name: spouse.name,
            surname: spouse.surname,
            gender: spouse.gender
          },
          children: []
        }

        children.sort((a, b) => (a.birthDate || '9999') > (b.birthDate || '9999') ? 1 : -1)

        children.forEach(child => {
          const childNode = buildFamilyNode(child, depth + 1)
          if (childNode) marriageNode.children.push(childNode)
        })

        if (marriageNode.children.length === 0) delete marriageNode.children
        return marriageNode
      })

      return {
        type: 'multiple-marriages',
        id: `marriages-${person.id}`,
        marriages: marriages
      }
    }

    const treeData = buildFamilyNode(root, 0)
    return d3.hierarchy(treeData, d => {
      if (d.marriages) return d.marriages
      return d.children || []
    })
  }

  getSpousePairs() {
    const pairs = []
    const seen = new Set()
    
    this.people.forEach(person => {
      if (person.spouseId && !seen.has(person.id)) {
        const spouse = this.getPersonById(person.spouseId)
        
        if (spouse) {
          pairs.push({
            person1: person,
            person2: spouse
          })
          
          seen.add(person.id)
          seen.add(spouse.id)
        }
      }
    })
    
    console.log('💑 Найдено супружеских пар:', pairs.length)
    return pairs
  }

  getSpouses(personId) {
    const person = this.byId.get(personId)
    if (!person) return []
    
    const spouses = new Set()
    
    if (person.gender === 'M' && person.wifeId) {
      spouses.add(person.wifeId)
    } else if (person.gender === 'F' && person.husbandId) {
      spouses.add(person.husbandId)
    }
    
    const children = this.getChildrenOf(personId)
    
    children.forEach(child => {
      if (person.gender === 'M' && child.motherId) {
        spouses.add(child.motherId)
      } else if (person.gender === 'F' && child.fatherId) {
        spouses.add(child.fatherId)
      }
    })
    
    return Array.from(spouses).map(id => this.byId.get(id)).filter(s => s)
  }
}

window.FamilyTree = FamilyTree
