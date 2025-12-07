window.importExcelToPeople = async function(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'binary' })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet)
        const people = rows.map(row => ({
          id: Number(row['ID']) || 0, name: row['Имя'] || '', surname: row['Фамилия'] || '',
          middlename: row['Отчество'] || '', gender: (row['Пол'] === 'Ж' ? 'F' : 'M'),
          birthDate: row['Дата рождения'] || '', deathDate: row['Дата смерти'] || '',
          birthPlace: row['Место рождения'] || '', biography: row['Биография'] || '',
          photo: row['Фото'] || '', fatherId: row['ID_отца'] || null,
          motherId: row['ID_матери'] || null, spouseId: row['ID_супруга'] || null
        }))
        resolve(people)
      } catch (err) { reject(err) }
    }
    reader.readAsBinaryString(file)
  })
}
