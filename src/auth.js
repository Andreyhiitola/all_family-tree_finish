// Система аутентификации для защиты редактирования
(function() {
  let isAuthenticated = false;
  let authToken = null;
  let pendingAction = null;

  // Проверка токена через GitHub API
  window.verifyToken = async function() {
    const token = document.getElementById('github-token').value.trim();
    const statusEl = document.getElementById('auth-status');
    
    if (!token) {
      statusEl.innerHTML = '❌ Введите токен';
      statusEl.style.color = 'red';
      return;
    }
    
    statusEl.innerHTML = '⏳ Проверка...';
    statusEl.style.color = 'orange';
    
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`
        }
      });
      
      if (response.ok) {
        const user = await response.json();
        isAuthenticated = true;
        authToken = token;
        
        statusEl.innerHTML = `✅ Добро пожаловать, ${user.login}!`;
        statusEl.style.color = 'green';
        
        // Сохраняем в sessionStorage (действует до закрытия вкладки)
        sessionStorage.setItem('auth_token', token);
        sessionStorage.setItem('auth_user', user.login);
        
        // Закрываем модалку через 1 секунду
        setTimeout(() => {
          document.getElementById('auth-modal').style.display = 'none';
          document.getElementById('github-token').value = '';
          
          // Выполняем отложенное действие
          if (pendingAction) {
            pendingAction();
            pendingAction = null;
          }
        }, 1000);
        
      } else {
        statusEl.innerHTML = '❌ Неверный токен';
        statusEl.style.color = 'red';
      }
    } catch (error) {
      statusEl.innerHTML = '❌ Ошибка проверки: ' + error.message;
      statusEl.style.color = 'red';
    }
  };

  // Проверка аутентификации перед действием
  window.requireAuth = function(action) {
    // Проверяем сохранённый токен
  const savedToken = sessionStorage.getItem("auth_token") || localStorage.getItem("github_token");
  if (savedToken) {
    authToken = savedToken;
    isAuthenticated = true;
    const username = sessionStorage.getItem("auth_user") || localStorage.getItem("github_owner") || "User";
    console.log("🔐 Восстановлена сессия:", username);
  }
    
    if (isAuthenticated) {
      action();
    } else {
      pendingAction = action;
      const modal = document.getElementById("auth-modal"); if (modal) modal.style.display = "flex";
    }
  };

  // Проверка статуса авторизации
  window.isAuthorized = function() {
    return isAuthenticated || sessionStorage.getItem("auth_token") || localStorage.getItem("github_token");
  };

  // Выход из системы
  window.logout = function() {
    isAuthenticated = false;
    authToken = null;
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    alert('Вы вышли из системы');
  };

  // Проверяем сохранённый токен при загрузке
  const savedToken = sessionStorage.getItem("auth_token") || localStorage.getItem("github_token");
  if (savedToken) {
    authToken = savedToken;
    isAuthenticated = true;
    const username = sessionStorage.getItem("auth_user") || localStorage.getItem("github_owner") || "User";
    console.log("🔐 Восстановлена сессия:", username);
  }
})();

// Показать модальное окно аутентификации
window.showAuthModal = function() {
  if (window.isAuthorized()) {
    // Уже вошли - предложить выйти
    const username = sessionStorage.getItem('auth_user');
    if (confirm(`Вы вошли как ${username}. Выйти?`)) {
      window.logout();
      updateAuthButton();
  toggleAddButton();
    }
  } else {
    document.getElementById('auth-modal').style.display = 'flex';
  }
};

// Обновить текст кнопки входа
function updateAuthButton() {
  const btn = document.getElementById('auth-button');
  if (!btn) return;
  
  if (window.isAuthorized()) {
    const username = sessionStorage.getItem('auth_user');
    btn.innerHTML = `✅ ${username}`;
    btn.title = 'Нажмите для выхода';
  } else {
    btn.innerHTML = '🔐 Вход';
    btn.title = 'Войти для редактирования';
  }
}

// Обновляем кнопку при загрузке и после входа
document.addEventListener('DOMContentLoaded', updateAuthButton);

// Переопределяем verifyToken чтобы обновлять кнопку
const originalVerifyToken = window.verifyToken;
window.verifyToken = async function() {
  await originalVerifyToken();
  updateAuthButton();
  toggleAddButton();
};

// Переопределяем logout чтобы обновлять кнопку
const originalLogout = window.logout;
window.logout = function() {
  originalLogout();
  updateAuthButton();
  toggleAddButton();
};

// Показать/скрыть кнопку добавления в зависимости от авторизации
function toggleAddButton() {
  const addBtn = document.getElementById('add-person');
  if (!addBtn) return;
  
  if (window.isAuthorized()) {
    addBtn.style.display = 'inline-block';
  } else {
    addBtn.style.display = 'none';
  }
}

// Вызываем при загрузке страницы
document.addEventListener('DOMContentLoaded', toggleAddButton);
