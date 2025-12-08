async function importExcelToPeople(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

        console.log('📥 Excel импорт: строк =', rows.length)
        console.log('Первая строка (пример):', rows[0])

        const people = rows.map(row => {
          // Приводим ID к числам
          const toId = (val) => {
            if (!val) return null
            const n = parseInt(val, 10)
            return isNaN(n) || n === 0 ? null : n
          }

          return {
            id: toId(row['ID'] || row['id']),
            name: (row['Имя'] || row['name'] || '').trim(),
            surname: (row['Фамилия'] || row['surname'] || '').trim(),
            middlename: (row['Отчество'] || row['middlename'] || '').trim(),
            gender: (row['Пол'] || row['gender'] || 'M').toString().toUpperCase() === 'Ж' || 
                    (row['Пол'] || row['gender'] || '').toString().toUpperCase() === 'F' ? 'F' : 'M',
            
            birthDate: row['Дата рождения'] || row['birthDate'] || '',
            deathDate: row['Дата смерти'] || row['deathDate'] || '',
            birthPlace: row['Место рождения'] || row['birthPlace'] || '',
            biography: row['Биография'] || row['biography'] || '',
            photo: row['Фото'] || row['photo'] || '',

            fatherId: toId(row['ID отца'] || row['fatherId']),
            motherId: toId(row['ID матери'] || row['motherId']),
            spouseId: toId(row['ID супруга'] || row['spouseId'])
          }
        })

        console.log('✅ Обработано:', people.length, 'человек')
        console.log('Пример обработанного:', people[0])
        resolve(people)
      } catch (err) {
        console.error('Ошибка парсинга Excel:', err)
        reject(err)
      }
    }

    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

window.importExcelToPeople = importExcelToPeople
