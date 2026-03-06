const CACHE_NAME = 'family-tree-v1';

// Все файлы приложения для кэширования
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './profile-modal-styles.css',
  './src/ui/TreeDock.css',
  './d3.v7.min.js',
  './xlsx.full.min.js',
  './FileSaver.min.js',
  './src/utils/dataStorage.js',
  './src/core/DataManager.js',
  './src/core/FamilyTree.js',
  './src/core/TreeVisualizer.js',
  './src/utils/importExcel.js',
  './src/utils/exportExcel.js',
  './src/auth.js',
  './src/utils/notifications.js',
  './src/ui/forms.js',
  './src/ui/table.js',
  './src/ui/ProfileModal.js',
  './src/ui/modals.js',
  './src/utils/GitHubSync.js',
  './src/utils/github-integration.js',
  './src/ui/TreeDock.js',
  './src/ui/app.js',
  './data/people.json',
  './map.html',
];

// Установка — кэшируем все файлы
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('📦 SW: кэшируем файлы...');
      // Кэшируем каждый файл отдельно, чтобы ошибка одного не блокировала остальные
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url).catch(err => {
          console.warn('⚠️ SW: не удалось кэшировать:', url, err.message);
        }))
      );
    }).then(() => {
      console.log('✅ SW: установка завершена');
      return self.skipWaiting();
    })
  );
});

// Активация — удаляем старые кэши
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log('🗑️ SW: удаляем старый кэш:', key);
          return caches.delete(key);
        })
      )
    ).then(() => {
      console.log('✅ SW: активирован');
      return self.clients.claim();
    })
  );
});

// Fetch — стратегия: сначала сеть, при ошибке — кэш
self.addEventListener('fetch', event => {
  // Пропускаем не-GET запросы и chrome-extension
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension://')) return;

  // Для data/people.json — Network First (данные могут меняться)
  if (event.request.url.includes('people.json') || event.request.url.includes('github.com')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Кэшируем свежий ответ
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Для всего остального — Cache First (быстро + офлайн)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

// Сообщение от приложения — принудительное обновление кэша
self.addEventListener('message', event => {
  if (event.data === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('🗑️ SW: кэш очищен по запросу');
    });
  }
});
