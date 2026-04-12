class FamilyTreeCore {
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

  // Получает детей пары (общих для обоих супругов)
  getChildrenOfCouple(person1Id, person2Id) {
    if (!person2Id) {
      // Если супруга нет - возвращаем всех детей person1
      return this.getChildrenOf(person1Id)
    }
    
    // Возвращаем только общих детей этой пары
    const person1 = this.getPersonById(person1Id)
    const person2 = this.getPersonById(person2Id)
    
    if (!person1 || !person2) return []
    
    const children = this.getChildrenOf(person1Id)
    
    // Фильтруем - оставляем только тех, у кого оба родителя из этой пары
    return children.filter(child => {
      if (person1.gender === "M") {
        return child.fatherId === person1Id && child.motherId === person2Id
      } else {
        return child.motherId === person1Id && child.fatherId === person2Id
      }
    })
  }

  // Найти всех супругов человека (текущих и бывших через детей)
  getAllSpouses(personId) {
    const spouses = [];
    const person = this.getPersonById(personId);
    
    // Текущий супруг из spouseId
    if (person?.spouseId) {
      spouses.push(this.getPersonById(person.spouseId));
    }
    
    // Бывшие супруги через детей
    const children = this.getChildrenOf(personId);
    children.forEach(child => {
      const otherId = person.gender === "M" ? child.motherId : child.fatherId;
      if (otherId && otherId !== person.spouseId) {
        const other = this.getPersonById(otherId);
        if (other && !spouses.find(s => s && s.id === other.id)) {
          spouses.push(other);
        }
      }
    });
    
    return spouses.filter(s => s);
  }

  /**
   * Найти все корневые семьи (люди без родителей)
   * Группирует супружеские пары вместе
   */
  findRootFamilies() {
    const rootPeople = this.people.filter(p => !p.fatherId && !p.motherId);
    const families = [];
    const processed = new Set();

    rootPeople.forEach(person => {
      if (processed.has(person.id)) return;

      const family = {
        id: person.id,
        person1: person,
        person2: null,
        label: `${person.name} ${person.surname}`
      };

      if (person.spouseId) {
        const spouse = this.getPersonById(person.spouseId);
        if (spouse && rootPeople.find(p => p.id === spouse.id)) {
          family.person2 = spouse;
          family.label = `${person.name} + ${spouse.name} ${person.surname}`;
          processed.add(spouse.id);
        }
      }

      families.push(family);
      processed.add(person.id);
    });

    families.sort((a, b) => {
  const dateA = String(a.person1.birthDate || "9999");
  const dateB = String(b.person1.birthDate || "9999");
  return dateA.localeCompare(dateB);
});


    return families;
  }
  buildDescendantsHierarchy(rootId) {
    const root = this.getPersonById(rootId)
    if (!root) {
      console.warn('❌ Корень не найден в индексе:', rootId)
      return null
    }
    
    console.log(`🌳 Строим семейное дерево от: ${root.name} ${root.surname} (ID: ${root.id})`)
    
    const processedPeople = new Set()
    
    // Рекурсивная функция для построения узла
    const buildFamilyNode = (person, depth) => {
      if (depth > 50 || processedPeople.has(person.id)) {
        return null
      }
      
      processedPeople.add(person.id)
      
      // Найти всех супругов (текущих и бывших)
      const spouses = this.getAllSpouses(person.id)
      
      // Если супругов несколько - создаём узел-разделитель
      if (spouses.length > 1) {
        const separatorNode = {
          type: 'separator',
          id: `separator-${person.id}`,
          person: {
            id: person.id,
            name: person.name,
            surname: person.surname,
            gender: person.gender,
            photo: person.photo || '',
            birthDate: person.birthDate || ''
          },
          children: []
        }
        
        // Для каждого супруга создаём отдельный узел брака
        spouses.forEach(spouse => {
          if (spouse) {
            processedPeople.add(spouse.id)
            
            const marriageNode = {
              type: 'marriage',
              id: `marriage-${person.id}-${spouse.id}`,
              person1: {
                id: person.id,
                name: person.name,
                surname: person.surname,
                gender: person.gender,
                photo: person.photo || '',
                birthDate: person.birthDate || ''
              },
              person2: {
                id: spouse.id,
                name: spouse.name,
                surname: spouse.surname,
                gender: spouse.gender,
                photo: spouse.photo || '',
                birthDate: spouse.birthDate || ''
              },
              children: []
            }
            
            // Получаем детей этой пары
            const children = this.getChildrenOfCouple(person.id, spouse.id)
            children.sort((a, b) => (a.birthDate || '9999') > (b.birthDate || '9999') ? 1 : -1)
            
            children.forEach(child => {
              const childNode = buildFamilyNode(child, depth + 1)
              if (childNode) {
                marriageNode.children.push(childNode)
              }
            })
            
            if (marriageNode.children.length === 0) {
              delete marriageNode.children
            }
            
            separatorNode.children.push(marriageNode)
          }
        })
        
        return separatorNode
      }
      
      // Если супруг один или нет супругов - обычный узел
      const spouse = spouses[0] || null
      
      if (spouse) {
        processedPeople.add(spouse.id)
      }
      
      const familyNode = {
        type: 'family',
        id: `family-${person.id}`,
        person1: {
          id: person.id,
          name: person.name,
          surname: person.surname,
          gender: person.gender,
          photo: person.photo || '',
          birthDate: person.birthDate || ''
        },
        person2: spouse ? {
          id: spouse.id,
          name: spouse.name,
          surname: spouse.surname,
          gender: spouse.gender,
          photo: spouse.photo || '',
          birthDate: spouse.birthDate || ''
        } : null,
        children: []
      }
      
      // Получаем всех детей пары
      const children = this.getChildrenOfCouple(person.id, spouse?.id)
      children.sort((a, b) => (a.birthDate || '9999') > (b.birthDate || '9999') ? 1 : -1)
      
      children.forEach(child => {
        const childNode = buildFamilyNode(child, depth + 1)
        if (childNode) {
          familyNode.children.push(childNode)
        }
      })
      
      if (familyNode.children.length === 0) {
        delete familyNode.children
      }
      
      return familyNode
    }
    
    const treeData = buildFamilyNode(root, 0)
    return d3.hierarchy(treeData, d => d.children || [])
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
}

window.FamilyTreeCore = FamilyTreeCore
