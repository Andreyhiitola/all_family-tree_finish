window.initModals = function initModals(app) {
  // Безопасная привязка обработчиков
  const personModal = document.getElementById('person-modal')
  const tableModal = document.getElementById('data-table-modal')
  const importModal = document.getElementById('import-modal')
  const deleteModal = document.getElementById('delete-modal')

  // Add person
  const addBtn = document.getElementById('add-person')
  if (addBtn) addBtn.onclick = () => app.openPersonForm(null)

  // Cancel form
  const cancelBtn = document.getElementById('cancel-form')
  if (cancelBtn && personModal) cancelBtn.onclick = () => personModal.style.display = 'none'

  // Form submit
  const form = document.getElementById('person-form')
  if (form) form.onsubmit = e => { e.preventDefault(); app.savePersonFromForm() }

  // Table
  const tableBtn = document.getElementById('show-data-table')
  if (tableBtn && tableModal) tableBtn.onclick = () => { tableModal.style.display = 'block'; app.refreshTable() }

  // Import
  const importBtn = document.getElementById('import-excel')
  if (importBtn && importModal) importBtn.onclick = () => importModal.style.display = 'block'

  // Delete
  const confirmDelete = document.getElementById('confirm-delete')
  if (confirmDelete) confirmDelete.onclick = () => app.confirmDeletePerson()

  const cancelDelete = document.getElementById('cancel-delete')
  if (cancelDelete && deleteModal) cancelDelete.onclick = () => deleteModal.style.display = 'none'

  // Клик вне модалки
  window.onclick = event => {
    if (event.target.classList && event.target.classList.contains('modal')) {
      event.target.style.display = 'none'
    }
  }
}
