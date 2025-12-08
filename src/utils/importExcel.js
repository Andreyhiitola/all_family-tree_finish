async function importExcelToPeople(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        console.log('📥 Импорт Excel: найдено строк:', jsonData.length)

        const toId = (val) => {
          if (!val) return null
          const n = parseInt(val, 10)
          return (isNaN(n) || n === 0) ? null : n
        }

        const people = jsonData.map(row => {
          // Определяем пол
          let gender = 'M'
          const genderRaw = (row['Пол'] || row['gender'] || '').toString().trim().toUpperCase()
          if (genderRaw === 'Ж' || genderRaw === 'F' || genderRaw === 'ЖЕНСКИЙ') {
            gender = 'F'
          }

          // Обрабатываем галерею (если есть колонка "Галерея" или "photos")
          let photosArray = []
          const photosRaw = row['Галерея'] || row['photos'] || ''
          if (photosRaw) {
            // Разбиваем по запятой, убираем пробелы
            photosArray = photosRaw.toString()
              .split(',')
              .map(url => url.trim())
              .filter(url => url.length > 0)
          }

          return {
            id: toId(row['ID'] || row['id']),
            name: (row['Имя'] || row['name'] || '').trim(),
            surname: (row['Фамилия'] || row['surname'] || '').trim(),
            middlename: (row['Отчество'] || row['middlename'] || '').trim(),
            gender: gender,
            
            birthDate: row['Дата рождения'] || row['birthDate'] || '',
            deathDate: row['Дата смерти'] || row['deathDate'] || '',
            birthPlace: row['Место рождения'] || row['birthPlace'] || '',
            biography: row['Биография'] || row['biography'] || '',
            
            photo: row['Фото'] || row['photo'] || '',  // 👈 Аватар
            photos: photosArray,  // 👈 Массив фото для галереи

            fatherId: toId(row['ID отца'] || row['fatherId']),
            motherId: toId(row['ID матери'] || row['motherId']),
            spouseId: toId(row['ID супруга'] || row['spouseId'])
          }
        }).filter(p => p.id && p.id > 0)

        console.log('✅ Импортировано людей:', people.length)
        resolve(people)
      } catch (error) {
        console.error('❌ Ошибка парсинга Excel:', error)
        reject(error)
      }
    }

    reader.onerror = (error) => {
      console.error('❌ Ошибка чтения файла:', error)
      reject(error)
    }

    reader.readAsArrayBuffer(file)
  })
}

window.importExcelToPeople = importExcelToPeople
