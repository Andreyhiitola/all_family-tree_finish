window.initModals = function initModals(app) {
  const personModal = document.getElementById('person-modal')
  const deleteModal = document.getElementById('delete-modal')
  const tableModal = document.getElementById('data-table-modal')
  const importModal = document.getElementById('import-modal')

  document.getElementById('add-person').addEventListener('click', () => {
    app.openPersonForm(null)
  })

  document.getElementById('cancel-form').addEventListener('click', () => {
    personModal.style.display = 'none'
  })

  document.getElementById('person-form').addEventListener('submit', (e) => {
    e.preventDefault()
    app.savePersonFromForm()
  })

  document.getElementById('show-data-table').addEventListener('click', () => {
    tableModal.style.display = 'block'
    app.refreshTable()
  })

  tableModal.querySelector('.close').addEventListener('click', () => {
    tableModal.style.display = 'none'
  })

  document.getElementById('import-excel').addEventListener('click', () => {
    importModal.style.display = 'block'
  })

  importModal.querySelector('.close').addEventListener('click', () => {
    importModal.style.display = 'none'
  })

  document.getElementById('cancel-import').addEventListener('click', () => {
    importModal.style.display = 'none'
  })

  document.getElementById('confirm-delete').addEventListener('click', () => {
    app.confirmDeletePerson()
  })

  document.getElementById('cancel-delete').addEventListener('click', () => {
    deleteModal.style.display = 'none'
  })
}
