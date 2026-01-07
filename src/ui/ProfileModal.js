class ProfileModal {
    constructor() {
        this.modal = null;
        this.currentPerson = null;
        console.log('ProfileModal: Constructor called');
    }

    init() {
        console.log('ProfileModal: init() called');
        this.createModal();
        this.attachEventListeners();
        console.log('ProfileModal: Initialized');
    }

    createModal() {
        // Проверяем, не создано ли уже модальное окно
        const existing = document.getElementById('profile-modal');
        if (existing) {
            console.log('ProfileModal: Modal already exists, removing old one');
            existing.remove();
        }

        // Создаём модальное окно
        const modalHTML = `
            <div id="profile-modal" class="profile-modal">
                <div class="profile-modal-content">
                    <button class="profile-modal-close">&times;</button>
                    <button class="profile-modal-fullscreen" title="Развернуть на весь экран">⛶</button>
                    
                    <div class="profile-header">
                        <div class="profile-photo-container">
                            <img id="profile-photo" src="" alt="Фото" class="profile-photo">
                        </div>
                        <div class="profile-main-info">
                            <h2 id="profile-name">Имя Фамилия</h2>
                            <div class="profile-dates">
                                <span id="profile-birth"></span>
                                <span id="profile-death"></span>
                            </div>
                        </div>
                    </div>

                    <div class="profile-tabs">
                        <button class="profile-tab active" data-tab="info">Информация</button>
                        <button class="profile-tab" data-tab="family">Семья</button>
                        <button class="profile-tab" data-tab="gallery">Галерея</button>
                    </div>

                    <div class="profile-content">
                        <!-- Вкладка: Информация -->
                        <div id="tab-info" class="profile-tab-content active">
                            <div class="profile-info-grid">
                                <div class="profile-info-item">
                                    <span class="profile-label">Пол:</span>
                                    <span id="profile-gender" class="profile-value"></span>
                                </div>
                                <div class="profile-info-item">
                                    <span class="profile-label">Дата рождения:</span>
                                    <span id="profile-birthdate" class="profile-value"></span>
                                </div>
                                <div class="profile-info-item">
                                    <span class="profile-label">Место рождения:</span>
                                    <span id="profile-birthplace" class="profile-value"></span>
                                </div>
                                <div id="profile-deathdate-container" class="profile-info-item">
                                    <span class="profile-label">Дата смерти:</span>
                                    <span id="profile-deathdate" class="profile-value"></span>
                                </div>
                                <div class="profile-info-item full-width">
                                    <span class="profile-label">Биография:</span>
                                    <p id="profile-bio" class="profile-value"></p>
                                </div>
                            </div>
                        </div>

                        <!-- Вкладка: Семья -->
                        <div id="tab-family" class="profile-tab-content">
                            <div id="profile-family" class="profile-family-section">
                                <!-- Сюда будет добавлена информация о семье -->
                            </div>
                        </div>

                        <!-- Вкладка: Галерея -->
                        <div id="tab-gallery" class="profile-tab-content">
                            <div id="profile-gallery" class="profile-gallery">
                                <!-- Сюда будут добавлены фотографии -->
                            </div>
                        </div>
                    </div>

                    <div class="profile-actions">
                        <button id="profile-edit" class="profile-btn profile-btn-primary">
                            <i class="fas fa-edit"></i> Редактировать
                        </button>
                        <button id="profile-view-tree" class="profile-btn profile-btn-secondary">
                            <i class="fas fa-sitemap"></i> Показать в дереве
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('profile-modal');
    }

    attachEventListeners() {
        if (!this.modal) {
            console.error('ProfileModal: Cannot attach listeners - modal is null');
            return;
        }

        // Закрытие модального окна
        const closeBtn = this.modal.querySelector('.profile-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Закрытие по клику вне окна
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Переключение вкладок
        const tabs = this.modal.querySelectorAll('.profile-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Кнопка редактирования
        const editBtn = this.modal.querySelector('#profile-edit');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                if (this.currentPerson) {
                    this.close();
                    if (window.openEditForm) {
                        window.openEditForm(this.currentPerson.id);
                    }
                }
            });
        }

        // Кнопка "Показать в дереве"
        const viewTreeBtn = this.modal.querySelector('#profile-view-tree');
        if (viewTreeBtn) {
            viewTreeBtn.addEventListener('click', () => {
                if (this.currentPerson) {
                    this.close();
                    if (window.focusOnPerson) {
                        window.focusOnPerson(this.currentPerson.id);
                    }
                }
            });
        }

        // Кнопка fullscreen
        const fullscreenBtn = this.modal.querySelector('.profile-modal-fullscreen');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }
    }

    toggleFullscreen() {
        const content = this.modal.querySelector('.profile-modal-content');
        if (!content) return;

        if (content.classList.contains('fullscreen')) {
            // Выход из fullscreen
            content.classList.remove('fullscreen');
            document.body.style.overflow = 'hidden'; // Восстанавливаем блокировку прокрутки фона
        } else {
            // Вход в fullscreen
            content.classList.add('fullscreen');
        }
    }

    findPersonById(personId) {
        if (!window.dataManager) return null;
        const people = window.dataManager.getPeople();
        return people.find(p => p.id === personId);
    }

    // Получить родителей
    getParents(personId) {
        const person = this.findPersonById(personId);
        if (!person) return [];
        
        const parents = [];
        if (person.fatherId) {
            const father = this.findPersonById(person.fatherId);
            if (father) parents.push(father);
        }
        if (person.motherId) {
            const mother = this.findPersonById(person.motherId);
            if (mother) parents.push(mother);
        }
        return parents;
    }

    // Получить супруга/супругу
    getSpouses(personId) {
        const person = this.findPersonById(personId);
        if (!person || !person.spouseId) return [];
        
        const spouse = this.findPersonById(person.spouseId);
        return spouse ? [spouse] : [];
    }

    // Получить детей
    getChildren(personId) {
        if (!window.familyTreeInstance) return [];
        return window.familyTreeInstance.getChildrenOf(personId) || [];
    }

    // Получить братьев и сестёр
    getSiblings(personId) {
        const person = this.findPersonById(personId);
        if (!person) return [];
        
        const people = window.dataManager.getPeople();
        return people.filter(p => 
            p.id !== personId && 
            ((p.fatherId && p.fatherId === person.fatherId) ||
             (p.motherId && p.motherId === person.motherId))
        );
    }

    open(personId) {
        if (!this.modal) {
            console.error('ProfileModal: Modal not initialized, calling init()');
            this.init();
        }

        if (!window.dataManager) {
            alert('Ошибка: DataManager не инициализирован.');
            return;
        }

        const person = this.findPersonById(personId);
        if (!person) {
            alert('Человек с ID ' + personId + ' не найден');
            return;
        }

        this.currentPerson = person;
        this.fillPersonData(person);
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    close() {
        if (!this.modal) return;
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        this.currentPerson = null;
    }

    fillPersonData(person) {
        // Основная информация
        const nameEl = document.getElementById('profile-name');
        if (nameEl) nameEl.textContent = person.name || 'Неизвестно';
        
        // Фото - ИСПРАВЛЕНО: убрано дублирование пути
        const photoImg = document.getElementById('profile-photo');
        if (photoImg && window.dataManager) {
            if (person.photo) {
                photoImg.src = window.dataManager.getPhotoUrl(person.photo);
            } else {
                photoImg.src = window.dataManager.getPhotoUrl('default-avatar.png');
            }
            photoImg.style.display = 'block';
        }

        // Даты в заголовке
        const birthYear = person.birthDate ? new Date(person.birthDate).getFullYear() : '?';
        const deathYear = person.deathDate ? new Date(person.deathDate).getFullYear() : '';
        
        const birthEl = document.getElementById('profile-birth');
        const deathEl = document.getElementById('profile-death');
        if (birthEl) birthEl.textContent = birthYear;
        if (deathEl) deathEl.textContent = deathYear ? `- ${deathYear}` : '';

        // Детальная информация
        const genderEl = document.getElementById('profile-gender');
        if (genderEl) {
            genderEl.textContent = person.gender === 'M' ? 'Мужчина' : person.gender === 'F' ? 'Женщина' : 'Не указан';
        }

        const birthdateEl = document.getElementById('profile-birthdate');
        if (birthdateEl) {
            birthdateEl.textContent = this.formatDate(person.birthDate) || 'Не указана';
        }

        const birthplaceEl = document.getElementById('profile-birthplace');
        if (birthplaceEl) {
            birthplaceEl.textContent = person.birthPlace || 'Не указано';
        }

        const deathdateEl = document.getElementById('profile-deathdate');
        const deathdateContainer = document.getElementById('profile-deathdate-container');
        if (person.deathDate) {
            // Человек умер - показываем дату смерти
            if (deathdateEl) {
                deathdateEl.textContent = this.formatDate(person.deathDate) || 'Не указана';
            }
            if (deathdateContainer) {
                deathdateContainer.style.display = 'flex';
            }
        } else {
            // Человек жив - скрываем блок даты смерти
            if (deathdateContainer) {
                deathdateContainer.style.display = 'none';
            }
        }

        const bioEl = document.getElementById('profile-bio');
        if (bioEl) {
            bioEl.textContent = person.bio || 'Биография не указана';
        }

        // Заполняем семейную информацию
        this.fillFamilySection(person);

        // Заполняем галерею
        this.fillGallery(person);
    }

    fillFamilySection(person) {
        const familyContainer = document.getElementById('profile-family');
        if (!familyContainer) {
            console.error('profile-family element not found');
            return;
        }

        let familyHTML = '';

        // Родители
        const parents = this.getParents(person.id);
        if (parents.length > 0) {
            familyHTML += '<div class="family-group"><h3>Родители</h3><div class="family-members">';
            parents.forEach(parent => {
                familyHTML += this.createPersonCard(parent);
            });
            familyHTML += '</div></div>';
        }

        // Супруги
        const spouses = this.getSpouses(person.id);
        if (spouses.length > 0) {
            familyHTML += '<div class="family-group"><h3>Супруг(а)</h3><div class="family-members">';
            spouses.forEach(spouse => {
                familyHTML += this.createPersonCard(spouse);
            });
            familyHTML += '</div></div>';
        }

        // Дети
        const children = this.getChildren(person.id);
        if (children.length > 0) {
            familyHTML += '<div class="family-group"><h3>Дети</h3><div class="family-members">';
            children.forEach(child => {
                familyHTML += this.createPersonCard(child);
            });
            familyHTML += '</div></div>';
        }

        // Братья и сёстры
        const siblings = this.getSiblings(person.id);
        if (siblings.length > 0) {
            familyHTML += '<div class="family-group"><h3>Братья и сёстры</h3><div class="family-members">';
            siblings.forEach(sibling => {
                familyHTML += this.createPersonCard(sibling);
            });
            familyHTML += '</div></div>';
        }

        if (familyHTML === '') {
            familyHTML = '<p class="no-data">Информация о семье отсутствует</p>';
        }

        familyContainer.innerHTML = familyHTML;
    }

    createPersonCard(person) {
        const photoPath = window.dataManager.getPhotoUrl(person.photo || 'default-avatar.png');
        const birthYear = person.birthDate ? new Date(person.birthDate).getFullYear() : '?';
        const deathYear = person.deathDate ? ` - ${new Date(person.deathDate).getFullYear()}` : '';
        
        return `
            <div class="family-member-card" onclick="window.profileModal.open(${person.id})">
                <img src="${photoPath}" alt="${person.name}" class="family-member-photo">
                <div class="family-member-info">
                    <div class="family-member-name">${person.name}</div>
                    <div class="family-member-dates">${birthYear}${deathYear}</div>
                </div>
            </div>
        `;
    }

    fillGallery(person) {
        const galleryContainer = document.getElementById('profile-gallery');
        if (!galleryContainer) {
            console.error('profile-gallery element not found');
            return;
        }

        let galleryHTML = '';

        // Основное фото
        if (person.photo && window.dataManager) {
            const photoPath = window.dataManager.getPhotoUrl(person.photo);
            galleryHTML += `
                <div class="gallery-item">
                    <img src="${photoPath}" alt="${person.name}">
                </div>
            `;
        }

        // Дополнительные фото
        if (person.photos && person.photos.length > 0 && window.dataManager) {
            const galleryUrls = window.dataManager.getGalleryUrls(person.photos);
            galleryUrls.forEach((photoPath, index) => {
                if (photoPath) {
                    galleryHTML += `
                        <div class="gallery-item">
                            <img src="${photoPath}" alt="${person.name} - фото ${index + 1}">
                        </div>
                    `;
                }
            });
        }

        if (galleryHTML === '') {
            galleryHTML = '<p class="no-data">Фотографии отсутствуют</p>';
        }

        galleryContainer.innerHTML = galleryHTML;

        // Добавляем обработчик кликов для открытия фото
        const galleryItems = galleryContainer.querySelectorAll(".gallery-item img");
        galleryItems.forEach(img => {
            img.style.cursor = "pointer";
            img.addEventListener("click", () => {
                this.openPhotoModal(img.src);
            });
        });
    }

    switchTab(tabName) {
        const tabs = this.modal.querySelectorAll('.profile-tab');
        const contents = this.modal.querySelectorAll('.profile-tab-content');
        
        tabs.forEach(tab => tab.classList.remove('active'));
        contents.forEach(content => content.classList.remove('active'));

        const activeTab = this.modal.querySelector(`[data-tab="${tabName}"]`);
        const activeContent = this.modal.querySelector(`#tab-${tabName}`);
        
        if (activeTab) activeTab.classList.add('active');
        if (activeContent) activeContent.classList.add('active');
    }

    formatDate(dateString) {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
    openPhotoModal(imageSrc) {
        const galleryImages = Array.from(document.querySelectorAll(".gallery-item img")).map(img => img.src);
        let currentIndex = galleryImages.indexOf(imageSrc);
        
        const modal = document.createElement("div");
        modal.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.9);z-index:10000;display:flex;align-items:center;justify-content:center;";
        
        const img = document.createElement("img");
        img.src = imageSrc;
        img.style.cssText = "max-width:85%;max-height:85%;object-fit:contain;";
        
        const prevBtn = document.createElement("button");
        prevBtn.innerHTML = "◀";
        prevBtn.style.cssText = "position:absolute;left:20px;top:50%;transform:translateY(-50%);font-size:48px;background:rgba(255,255,255,0.2);border:none;color:white;cursor:pointer;padding:20px;border-radius:8px;";
        prevBtn.onclick = (e) => { e.stopPropagation(); currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length; img.src = galleryImages[currentIndex]; };
        
        const nextBtn = document.createElement("button");
        nextBtn.innerHTML = "▶";
        nextBtn.style.cssText = "position:absolute;right:20px;top:50%;transform:translateY(-50%);font-size:48px;background:rgba(255,255,255,0.2);border:none;color:white;cursor:pointer;padding:20px;border-radius:8px;";
        nextBtn.onclick = (e) => { e.stopPropagation(); currentIndex = (currentIndex + 1) % galleryImages.length; img.src = galleryImages[currentIndex]; };
        
        const closeBtn = document.createElement("button");
        closeBtn.innerHTML = "✕";
        closeBtn.style.cssText = "position:absolute;top:20px;right:20px;font-size:36px;background:none;border:none;color:white;cursor:pointer;";
        closeBtn.onclick = () => modal.remove();
        
        modal.appendChild(img);
        modal.appendChild(prevBtn);
        modal.appendChild(nextBtn);
        modal.appendChild(closeBtn);
        document.body.appendChild(modal);
        
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        document.addEventListener("keydown", function handler(e) {
            if (e.key === "Escape") { modal.remove(); document.removeEventListener("keydown", handler); }
            else if (e.key === "ArrowLeft") { currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length; img.src = galleryImages[currentIndex]; }
            else if (e.key === "ArrowRight") { currentIndex = (currentIndex + 1) % galleryImages.length; img.src = galleryImages[currentIndex]; }
        });
    }
}
