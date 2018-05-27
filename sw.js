const STATICCACHENAME = 'mws-reviews-static-v2';
const CONTENTIMGSCACHE = 'mws-restaurant-imgs';
const ALLCACHES = [
  STATICCACHENAME,
  CONTENTIMGSCACHE
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATICCACHENAME).then((cache) => {
      return cache.addAll([
        '/js/dbhelper.js',
        '/js/main.js',
        '/js/restaurantinfo.js',
        '/css/styles.css',
        '/data/restaurants.json',
        'index.html',
        'restaurant.html'
      ]);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName.startsWith('mws-') &&
                 !ALLCACHES.includes(cacheName);
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.pathname === '/') {
    event.respondWith(caches.match('/index.html'));
    return;
  }

  if (requestUrl.pathname === '/restaurant.html') {
    event.respondWith(caches.match('restaurant.html'));
    return;
  }

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname.startsWith('/images_responsive/')) {
      event.respondWith(serveRestaurantPhoto(event.request));
      return;
    }
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

serveRestaurantPhoto = (request) => {
  const storageUrl = request.url.replace(/-\d+px\.jpg$/, '');

  return caches.open(CONTENTIMGSCACHE).then((cache) => {
    return cache.match(storageUrl).then((response) => {
      if (response) {
        return response;
      }

      return fetch(request).then((networkResponse) => {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
};
