window.showNotification = function showNotification(message, type = 'info') {
  const old = document.querySelectorAll('.notification')
  old.forEach(n => n.remove())

  const div = document.createElement('div')
  div.className = `notification ${type}`
  div.textContent = message
  document.body.appendChild(div)

  setTimeout(() => {
    div.style.opacity = '0'
    div.style.transform = 'translateX(100%)'
    setTimeout(() => div.remove(), 300)
  }, 4000)
}
