/**
 * ProfileModal - Модальное окно профиля человека
 * Показывает аватар, информацию и галерею фото с горизонтальным скроллингом
 */
class ProfileModal {
  constructor(dataManager) {
    this.dataManager = dataManager
    this.modal = null
    this.currentPersonId = null
    
    this.init()
  }

  init() {
    this.modal = document.getElementById('profile-modal')
    
    if (!this.modal) {
      this.createModal()
    }
    
    const closeBtn = this.modal.querySelector('.close')
    if (closeBtn) {
      closeBtn.onclick = () => this.close()
    }
    
    this.modal.onclick = (e) => {
      if (e.target === this.modal) {
        this.close()
      }
    }
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.style.display === 'block') {
        this.close()
      }
    })
    
    console.log('ProfileModal initialized')
  }

  createModal() {
    const modal = document.createElement('div')
    modal.id = 'profile-modal'
    modal.className = 'modal'
    
    modal.innerHTML = '<div class="modal-content modal-profile">' +
      '<span class="close">&times;</span>' +
      '<div class="profile-container">' +
        '<div class="profile-left">' +
          '<div class="profile-avatar-container">' +
            '<img id="profile-avatar" src="" alt="Photo" class="profile-avatar">' +
          '</div>' +
          '<h2 id="profile-name" class="profile-name">Name</h2>' +
          '<p id="profile-dates" class="profile-dates"></p>' +
          '<p id="profile-place" class="profile-place"></p>' +
          '<div class="profile-actions">' +
            '<button id="profile-edit" class="btn btn-edit">Edit</button>' +
            '<button id="profile-delete" class="btn btn-delete">Delete</button>' +
          '</div>' +
        '</div>' +
        '<div class="profile-right">' +
          '<div class="profile-section">' +
            '<h3>Biography</h3>' +
            '<div id="profile-biography" class="profile-bio">No biography.</div>' +
          '</div>' +
          '<div class="profile-section">' +
            '<h3>Family</h3>' +
            '<div id="profile-family" class="profile-family"></div>' +
          '</div>' +
          '<div class="profile-section">' +
            '<h3>Gallery</h3>' +
            '<div id="profile-gallery" class="profile-gallery">' +
              '<p style="color:#999;">No photos</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>'
    
    document.body.appendChild(modal)
    this.modal = modal
  }

  open(personId) {
    const person = this.dataManager.getPeople().find(p => p.id === personId)
    
    if (!person) {
      console.error('Person not found:', personId)
      alert('Error: person not found')
      return
    }
    
    this.currentPersonId = personId
    console.log('Opening profile:', person.name, person.surname)
    
    this.fillPersonData(person)
    this.modal.style.display = 'block'
    
    setTimeout(() => {
      const content = this.modal.querySelector('.modal-content')
      if (content) {
        content.style.opacity = '1'
        content.style.transform = 'scale(1)'
      }
    }, 10)
  }

  fillPersonData(person) {
    const avatar = document.getElementById('profile-avatar')
    if (avatar) {
      const avatarUrl = this.dataManager.getPhotoUrl(person.photo)
      avatar.src = avatarUrl
      avatar.onerror = () => {
        avatar.src = this.dataManager.getPhotoUrl(null)
      }
    }
    
    const nameEl = document.getElementById('profile-name')
    if (nameEl) {
      const fullName = [person.name, person.surname, person.middlename].filter(x => x).join(' ')
      nameEl.textContent = fullName
    }
    
    const datesEl = document.getElementById('profile-dates')
    if (datesEl) {
      let datesText = ''
      if (person.birthDate) {
        datesText = 'Born: ' + this.formatDate(person.birthDate)
      }
      if (person.deathDate) {
        datesText += ' - Died: ' + this.formatDate(person.deathDate)
        const age = this.calculateAge(person.birthDate, person.deathDate)
        if (age) {
          datesText += ' (lived ' + age + ' years)'
        }
      } else if (person.birthDate) {
        const age = this.calculateAge(person.birthDate, null)
        if (age) {
          datesText += ' (age: ' + age + ' years)'
        }
      }
      datesEl.textContent = datesText
    }
    
    const placeEl = document.getElementById('profile-place')
    if (placeEl) {
      if (person.birthPlace) {
        placeEl.textContent = 'Place: ' + person.birthPlace
        placeEl.style.display = 'block'
      } else {
        placeEl.style.display = 'none'
      }
    }
    
    const bioEl = document.getElementById('profile-biography')
    if (bioEl) {
      if (person.biography && person.biography.trim()) {
        bioEl.innerHTML = this.formatBiography(person.biography)
      } else {
        bioEl.innerHTML = '<p style="color:#999;">No biography.</p>'
      }
    }
    
    this.fillFamilySection(person)
    this.fillGallery(person)
    this.attachActionButtons(person)
  }

  fillFamilySection(person) {
    const familyEl = document.getElementById('profile-family')
    if (!familyEl) {
      console.error('profile-family element not found')
      return
    }
    
    const people = this.dataManager.getPeople()
    
    let html = '<div class="family-list">'
    
    if (person.fatherId) {
      const father = people.find(p => p.id === person.fatherId)
      if (father) {
        html += this.createFamilyLink('Father', father)
      }
    }
    
    if (person.motherId) {
      const mother = people.find(p => p.id === person.motherId)
      if (mother) {
        html += this.createFamilyLink('Mother', mother)
      }
    }
    
    if (person.spouseId) {
      const spouse = people.find(p => p.id === person.spouseId)
      if (spouse) {
        const label = spouse.gender === 'M' ? 'Husband' : 'Wife'
        html += this.createFamilyLink(label, spouse)
      }
    }
    
    const children = people.filter(p => p.fatherId === person.id || p.motherId === person.id)
    
    if (children.length > 0) {
      html += '<div class="family-group"><strong>Children:</strong></div>'
      children.forEach(child => {
        html += this.createFamilyLink('', child)
      })
    }
    
    html += '</div>'
    
    if (html === '<div class="family-list"></div>') {
      familyEl.innerHTML = '<p style="color:#999;">No family links</p>'
    } else {
      familyEl.innerHTML = html
    }
  }

  createFamilyLink(label, person) {
    const name = [person.name, person.surname].filter(x => x).join(' ')
    return '<div class="family-member">' +
      '<span class="family-label">' + label + '</span>' +
      '<a href="#" class="family-link" data-person-id="' + person.id + '">' + name + '</a>' +
    '</div>'
  }

  fillGallery(person) {
    const galleryEl = document.getElementById('profile-gallery')
    if (!galleryEl) {
      console.error('profile-gallery element not found')
      return
    }
    
    if (!person.photos || person.photos.length === 0) {
      galleryEl.innerHTML = '<p style="color:#999;">No additional photos</p>'
      return
    }
    
    const photoUrls = this.dataManager.getGalleryUrls(person.photos)
    
    let html = '<div class="gallery-scroll">'
    
    photoUrls.forEach((url, index) => {
      html += '<div class="gallery-item">' +
        '<img src="' + url + '" alt="Photo ' + (index + 1) + '" class="gallery-photo" ' +
        'onclick="window.profileModal.openLightbox(\'' + url + '\')" ' +
        'onerror="this.style.display=\'none\'">' +
      '</div>'
    })
    
    html += '</div>'
    
    galleryEl.innerHTML = html
  }

  openLightbox(imageUrl) {
    let lightbox = document.getElementById('photo-lightbox')
    
    if (!lightbox) {
      const lightboxHTML = '<div id="photo-lightbox" class="lightbox">' +
        '<span class="lightbox-close">&times;</span>' +
        '<img class="lightbox-content" id="lightbox-img">' +
      '</div>'
      document.body.insertAdjacentHTML('beforeend', lightboxHTML)
      lightbox = document.getElementById('photo-lightbox')
      
      lightbox.querySelector('.lightbox-close').onclick = () => {
        lightbox.style.display = 'none'
      }
      
      lightbox.onclick = (e) => {
        if (e.target === lightbox) {
          lightbox.style.display = 'none'
        }
      }
    }
    
    const img = document.getElementById('lightbox-img')
    img.src = imageUrl
    lightbox.style.display = 'block'
  }

  attachActionButtons(person) {
    const editBtn = document.getElementById('profile-edit')
    if (editBtn) {
      editBtn.onclick = () => {
        this.close()
        if (window.app && typeof window.app.openPersonForm === 'function') {
          window.app.openPersonForm(person.id)
        } else {
          alert('Edit function not available')
        }
      }
    }
    
    const deleteBtn = document.getElementById('profile-delete')
    if (deleteBtn) {
      deleteBtn.onclick = () => {
        this.close()
        if (window.app && typeof window.app.askDeletePerson === 'function') {
          window.app.askDeletePerson(person.id)
        } else {
          alert('Delete function not available')
        }
      }
    }
    
    const familyLinks = this.modal.querySelectorAll('.family-link')
    familyLinks.forEach(link => {
      link.onclick = (e) => {
        e.preventDefault()
        const personId = parseInt(link.getAttribute('data-person-id'))
        this.open(personId)
      }
    })
  }

  close() {
    if (this.modal) {
      this.modal.style.display = 'none'
    }
  }

  formatDate(dateStr) {
    if (!dateStr) return ''
    
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    } catch (e) {
      return dateStr
    }
  }

  calculateAge(birthDate, deathDate) {
    if (!birthDate) return null
    
    try {
      const birth = new Date(birthDate)
      const end = deathDate ? new Date(deathDate) : new Date()
      
      let age = end.getFullYear() - birth.getFullYear()
      const monthDiff = end.getMonth() - birth.getMonth()
      
      if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
        age--
      }
      
      return age
    } catch (e) {
      return null
    }
  }

  formatBiography(text) {
    if (!text) return ''
    
    const paragraphs = text.split('\n').filter(p => p.trim())
    
    return paragraphs.map(p => '<p>' + this.escapeHtml(p) + '</p>').join('')
  }

  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}

window.ProfileModal = ProfileModal
