window.fillPersonFormFromData = function fillPersonFormFromData(person) {
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
  document.getElementById('form-father').value = person?.fatherId || ''
  document.getElementById('form-mother').value = person?.motherId || ''
  document.getElementById('form-spouse').value = person?.spouseId || ''
}

window.readPersonFromForm = function readPersonFromForm(existingId) {
  const id = existingId || Number(document.getElementById('form-id').value) || 0
  return {
    id,
    name: document.getElementById('form-name').value.trim(),
    surname: document.getElementById('form-surname').value.trim(),
    middlename: document.getElementById('form-middlename').value.trim(),
    gender: document.getElementById('form-gender').value,
    birthDate: document.getElementById('form-birthDate').value || '',
    deathDate: document.getElementById('form-deathDate').value || '',
    birthPlace: document.getElementById('form-birthPlace').value.trim(),
    biography: document.getElementById('form-biography').value.trim(),
    photo: document.getElementById('form-photo').value.trim(),
    fatherId: Number(document.getElementById('form-father').value) || null,
    motherId: Number(document.getElementById('form-mother').value) || null,
    spouseId: Number(document.getElementById('form-spouse').value) || null
  }
}
