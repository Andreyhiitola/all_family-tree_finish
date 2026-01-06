class ProfileModal {
    constructor() {
        this.modal = null;
        this.currentPerson = null;
        this.init();
    }

    init() {
        this.createModal();
        this.attachEventListeners();
    }

    createModal() {
        // Создаём модальное окно
        const modalHTML = `
            <div id="profile-modal" class="profile-modal">
                <div class="profile-modal-content">
                    <button class="profile-modal-close">&times;</button>
                    
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
                                <div class="profile-info-item">
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

        // Добавляем в body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('profile-modal');
    }

    attachEventListeners() {
        // Закрытие модального окна
        const closeBtn = this.modal.querySelector('.profile-modal-close');
        closeBtn.addEventListener('click', () => this.close());

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
        editBtn.addEventListener('click', () => {
            if (this.currentPerson) {
                this.close();
                // Открываем форму редактирования
                if (window.openEditForm) {
                    window.openEditForm(this.currentPerson.id);
                }
            }
        });

        // Кнопка "Показать в дереве"
        const viewTreeBtn = this.modal.querySelector('#profile-view-tree');
        viewTreeBtn.addEventListener('click', () => {
            if (this.currentPerson) {
                this.close();
                // Фокусируемся на человеке в дереве
                if (window.focusOnPerson) {
                    window.focusOnPerson(this.currentPerson.id);
                }
            }
        });
    }

    open(personId) {
        const person = window.dataManager.findPersonById(personId);
        if (!person) {
            console.error('Person not found:', personId);
            return;
        }

        this.currentPerson = person;
        this.fillPersonData(person);
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Блокируем прокрутку фона
    }

    close() {
        this.modal.classList.remove('active');
        document.body.style.overflow = ''; // Восстанавливаем прокрутку
        this.currentPerson = null;
    }

    fillPersonData(person) {
        // Основная информация
        document.getElementById('profile-name').textContent = person.name || 'Неизвестно';
        
        // Фото
        const photoImg = document.getElementById('profile-photo');
        if (person.photo) {
            // Убираем дублирование пути
            const photoPath = person.photo.startsWith('photos/') ? person.photo : `photos/${person.photo}`;
            photoImg.src = photoPath;
            photoImg.style.display = 'block';
        } else {
            photoImg.src = 'photos/default-avatar.png';
            photoImg.style.display = 'block';
        }

        // Даты в заголовке
        const birthYear = person.birthDate ? new Date(person.birthDate).getFullYear() : '?';
        const deathYear = person.deathDate ? new Date(person.deathDate).getFullYear() : '';
        document.getElementById('profile-birth').textContent = birthYear;
        document.getElementById('profile-death').textContent = deathYear ? `- ${deathYear}` : '';

        // Детальная информация
        document.getElementById('profile-gender').textContent = person.gender === 'M' ? 'Мужчина' : person.gender === 'F' ? 'Женщина' : 'Не указан';
        document.getElementById('profile-birthdate').textContent = this.formatDate(person.birthDate) || 'Не указана';
        document.getElementById('profile-birthplace').textContent = person.birthPlace || 'Не указано';
        document.getElementById('profile-deathdate').textContent = this.formatDate(person.deathDate) || 'Не указана';
        document.getElementById('profile-bio').textContent = person.bio || 'Биография не указана';

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
        const parents = window.dataManager.getParents(person.id);
        if (parents.length > 0) {
            familyHTML += '<div class="family-group"><h3>Родители</h3><div class="family-members">';
            parents.forEach(parent => {
                familyHTML += this.createPersonCard(parent);
            });
            familyHTML += '</div></div>';
        }

        // Супруги
        const spouses = window.dataManager.getSpouses(person.id);
        if (spouses.length > 0) {
            familyHTML += '<div class="family-group"><h3>Супруги</h3><div class="family-members">';
            spouses.forEach(spouse => {
                familyHTML += this.createPersonCard(spouse);
            });
            familyHTML += '</div></div>';
        }

        // Дети
        const children = window.dataManager.getChildren(person.id);
        if (children.length > 0) {
            familyHTML += '<div class="family-group"><h3>Дети</h3><div class="family-members">';
            children.forEach(child => {
                familyHTML += this.createPersonCard(child);
            });
            familyHTML += '</div></div>';
        }

        // Братья и сёстры
        const siblings = window.dataManager.getSiblings(person.id);
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
        const photoPath = person.photo 
            ? (person.photo.startsWith('photos/') ? person.photo : `photos/${person.photo}`)
            : 'photos/default-avatar.png';
        
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
        if (person.photo) {
            const photoPath = person.photo.startsWith('photos/') ? person.photo : `photos/${person.photo}`;
            galleryHTML += `
                <div class="gallery-item">
                    <img src="${photoPath}" alt="${person.name}">
                    <div class="gallery-caption">Основное фото</div>
                </div>
            `;
        }

        // Дополнительные фото
        if (person.gallery && person.gallery.length > 0) {
            person.gallery.forEach((photo, index) => {
                const photoPath = photo.startsWith('photos/') ? photo : `photos/${photo}`;
                galleryHTML += `
                    <div class="gallery-item">
                        <img src="${photoPath}" alt="${person.name} - фото ${index + 1}">
                        <div class="gallery-caption">Фото ${index + 1}</div>
                    </div>
                `;
            });
        }

        if (galleryHTML === '') {
            galleryHTML = '<p class="no-data">Фотографии отсутствуют</p>';
        }

        galleryContainer.innerHTML = galleryHTML;
    }

    switchTab(tabName) {
        // Убираем активный класс со всех вкладок
        const tabs = this.modal.querySelectorAll('.profile-tab');
        const contents = this.modal.querySelectorAll('.profile-tab-content');
        
        tabs.forEach(tab => tab.classList.remove('active'));
        contents.forEach(content => content.classList.remove('active'));

        // Активируем нужную вкладку
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
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.profileModal = new ProfileModal();
});
