const CACHE_NAME = 'keey-app-final-v5';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js',
  'https://e.top4top.io/p_3669xvp3m1.jpg'
];

// 1. تثبيت وحفظ الملفات فوراً
self.addEventListener('install', (evt) => {
  self.skipWaiting(); // تفعيل فوراً
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching offline page');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

// 2. تفعيل الخدمة وتنظيف القديم
self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

// 3. استراتيجية الشبكة أولاً، ثم الكاش (لضمان عمل التطبيق أوفلاين)
self.addEventListener('fetch', (evt) => {
  // استثناء طلبات API أو الروابط الخارجية مثل Reels
  if (evt.request.url.includes('http') && !evt.request.url.includes(self.location.origin)) {
     // الروابط الخارجية نحاول جلبها، لو فشل لا يهم (مثل iframe)
     return; 
  }

  evt.respondWith(
    fetch(evt.request)
      .catch(() => {
        return caches.match(evt.request)
          .then((response) => {
            if (response) {
              return response;
            } else if (evt.request.mode === 'navigate') {
              // إذا فشل كل شيء، ارجع للصفحة الرئيسية المحفوظة
              return caches.match('./index.html');
            }
          });
      })
  );
});
