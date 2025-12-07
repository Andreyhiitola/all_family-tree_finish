window.exportPeopleToExcel = function(people) {
  const rows = people.map(p => ({
    'ID': p.id, 'Имя': p.name, 'Фамилия': p.surname, 'Отчество': p.middlename || '',
    'Пол': p.gender === 'F' ? 'Ж' : 'М', 'Дата рождения': p.birthDate || '',
    'Дата смерти': p.deathDate || '', 'Место рождения': p.birthPlace || '',
    'ID_отца': p.fatherId || '', 'ID_матери': p.motherId || '',
    'ID_супруга': p.spouseId || '', 'Биография': p.biography || '', 'Фото': p.photo || ''
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Семейное древо')
  XLSX.writeFile(wb, `семейное_древо_${new Date().toISOString().split('T')[0]}.xlsx`)
}
