window.renderPeopleTable = function renderPeopleTable(people) {
  const table = document.getElementById('data-table')
  const tbody = table.querySelector('tbody')
  tbody.innerHTML = ''

  const byId = new Map(people.map(p => [p.id, p]))
  const sorted = [...people].sort((a, b) => a.id - b.id)

  for (const p of sorted) {
    const tr = document.createElement('tr')
    const father = p.fatherId ? byId.get(p.fatherId) : null
    const mother = p.motherId ? byId.get(p.motherId) : null
    const spouse = p.spouseId ? byId.get(p.spouseId) : null

    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.name}</td>
      <td>${p.surname}</td>
      <td>${p.middlename || ''}</td>
      <td>${p.gender === 'M' ? 'Мужской' : 'Женский'}</td>
      <td>${p.birthDate || ''}</td>
      <td>${p.deathDate || ''}</td>
      <td>${father ? `${father.name} ${father.surname} (ID: ${father.id})` : ''}</td>
      <td>${mother ? `${mother.name} ${mother.surname} (ID: ${mother.id})` : ''}</td>
      <td>${spouse ? `${spouse.name} ${spouse.surname} (ID: ${spouse.id})` : ''}</td>
      <td>
        <button class="btn-edit" data-id="${p.id}">✏</button>
        <button class="btn-delete" data-id="${p.id}">🗑</button>
      </td>
    `
    tbody.appendChild(tr)
  }
}
