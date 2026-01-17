const CACHE_NAME = 'keey-app-v3'; // قمنا بتحديث الإصدار لإجبار المتصفح على التحديث
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js',
  'https://e.top4top.io/p_3669xvp3m1.jpg' // تمت إضافة الأيقونة لضمان عمل التثبيت
];

// تثبيت التطبيق
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// تفعيل الخدمة وتنظيف الكاش القديم
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  return self.clients.claim();
});

// استراتيجية التشغيل: الشبكة أولاً ثم الكاش
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
