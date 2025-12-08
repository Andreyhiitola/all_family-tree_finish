function fillPersonFormFromData(person) {
  document.getElementById('form-id').value = person?.id || ''
  document.getElementById('form-name').value = person?.name || ''
  document.getElementById('form-surname').value = person?.surname || ''
  document.getElementById('form-middlename').value = person?.middlename || ''
  document.getElementById('form-gender').value = person?.gender || 'M'
  document.getElementById('form-birthDate').value = person?.birthDate || ''
  document.getElementById('form-deathDate').value = person?.deathDate || ''
  document.getElementById('form-birthPlace').value = person?.birthPlace || ''
  document.getElementById('form-biography').value = person?.biography || ''
  document.getElementById('form-photo').value = person?.photo || ''
  
  // Галерея: массив URLs преобразуем в строку через запятую
  const photos = person?.photos || []
  document.getElementById('form-photos').value = photos.join(', ')

  const fatherSel = document.getElementById('form-father')
  const motherSel = document.getElementById('form-mother')
  const spouseSel = document.getElementById('form-spouse')
  
  if (fatherSel) fatherSel.value = person?.fatherId || ''
  if (motherSel) motherSel.value = person?.motherId || ''
  if (spouseSel) spouseSel.value = person?.spouseId || ''
}

function readPersonFromForm() {
  const id = document.getElementById('form-id').value
  const photosText = document.getElementById('form-photos').value.trim()
  
  // Разбиваем строку URLs на массив
  const photosArray = photosText 
    ? photosText.split(',').map(url => url.trim()).filter(url => url.length > 0)
    : []

  return {
    id: id ? parseInt(id, 10) : null,
    name: document.getElementById('form-name').value.trim(),
    surname: document.getElementById('form-surname').value.trim(),
    middlename: document.getElementById('form-middlename').value.trim(),
    gender: document.getElementById('form-gender').value,
    birthDate: document.getElementById('form-birthDate').value,
    deathDate: document.getElementById('form-deathDate').value,
    birthPlace: document.getElementById('form-birthPlace').value.trim(),
    biography: document.getElementById('form-biography').value.trim(),
    photo: document.getElementById('form-photo').value.trim(),
    photos: photosArray,  // Массив URLs
    fatherId: parseInt(document.getElementById('form-father').value) || null,
    motherId: parseInt(document.getElementById('form-mother').value) || null,
    spouseId: parseInt(document.getElementById('form-spouse').value) || null
  }
}

window.fillPersonFormFromData = fillPersonFormFromData
window.readPersonFromForm = readPersonFromForm
