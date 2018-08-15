import idb from 'idb';

const STATICCACHENAME = 'mws-reviews-static-v3';
const CONTENTIMGSCACHE = 'mws-restaurant-imgs';
const ALLCACHES = [
  STATICCACHENAME,
  CONTENTIMGSCACHE
];

const dbRestaurantsPromise = idb.default.open('mws-restaurant-data', 1, (upgradeDB) => {
  switch (upgradeDB.oldVersion) {
    case 0:
      upgradeDB.createObjectStore('restaurants', { keyPath: 'id' });
      upgradeDB.createObjectStore('reviews', { keyPath: 'restaurant_id' });
      upgradeDB.createObjectStore('requests', { keyPath: 'id', autoIncrement:true });
  }
});



/* From Google  */

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATICCACHENAME).then((cache) => {
      return cache.addAll([
        '/js/dbhelper.js',
        '/js/main.js',
        '/js/restaurantinfo.js',
        '/css/styles.css',
        'index.html',
        'restaurant.html',
        'manifest.json'
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
  const request =  event.request;

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

  if(navigator.onLine) {
    // TODO: Stop this from running multiple times
    // If back online, send off awaiting POST and favorite(PUT) requests
    sendAndDeleteRequests();
  }

  /* Based on the Doug Brown live webinar solution */
  if (requestUrl.port === '1337' && request.method !== 'GET') {
    console.log('Not a GET request');
    handlePutAndPostRequest(requestUrl, event);
  } else if (requestUrl.port === '1337' && requestUrl.pathname.startsWith('/restaurants')) {
    handleRestaurantDataRequest(requestUrl, event);
  } else if (requestUrl.port === '1337' && requestUrl.pathname.startsWith('/reviews')) {
    handleReviewDataRequest(requestUrl, event);
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});

const handleRestaurantDataRequest = (requestUrl, event) => {
  const params = requestUrl.pathname.split('/');
  const query = new URLSearchParams(requestUrl.search.slice(1));
  let id;

  // Stop right here if fetching favorites
  // They should be fetched fresh
  if(query.has('is_favorite')){
    return;
  }

  if(params.length > 2) {
    id = params[2];
  } else {
    id = '-1';
  }

  event.respondWith(dbRestaurantsPromise.then((db) => {
    return db.transaction('restaurants', 'readonly').objectStore('restaurants').get(id);
  }).then((data) => {
    // If data is in indexeddb store, then use it
    // Else, fetch and store the data
    if (data && data.data) {
      return data.data;
    } else {
      return fetch(event.request).then((response) => {
        return response.json();
      }).then((json) => {
        return dbRestaurantsPromise.then((db) => {
          var tx = db.transaction('restaurants', 'readwrite');
          var store = tx.objectStore('restaurants').put({
            id: id,
            data: json
          });
          return json;
        });
      });
    }
  }).then((finalResponse) => {
    return new Response(JSON.stringify(finalResponse));
  }).catch((error) => {
    return new Response('Error fetching data', { status: error.status });
  }));
};

const handleReviewDataRequest = (requestUrl, event) => {
  const params = requestUrl.searchParams;
  const id = params.get('restaurant_id');
  event.respondWith(dbRestaurantsPromise.then((db) => {
    return db.transaction('reviews', 'readonly').objectStore('reviews').get(id);
  }).then((data) => {
    // If data is in indexeddb store, then use it
    // Else, fetch and store the data
    if (data && data.data) {
      return data.data;
    } else {
      return fetch(event.request).then((response) => {
        return response.json();
      }).then((json) => {
        return dbRestaurantsPromise.then((db) => {
          var tx = db.transaction('reviews', 'readwrite');
          var store = tx.objectStore('reviews').put({
            restaurant_id: id,
            data: json
          });
          return json;
        });
      });
    }
  }).then((finalResponse) => {
    return new Response(JSON.stringify(finalResponse));
  }).catch((error) => {
    return new Response('Error fetching data', { status: error.status });
  }));
};

const handlePutAndPostRequest = (requestUrl, event) => {
  const method = event.request.method;
  const url = '' + requestUrl;
  if(!navigator.onLine) {
    return dbRestaurantsPromise.then((db) => {
        var tx = db.transaction('requests', 'readwrite');
        var store = tx.objectStore('requests').put({
          requestType: method,
          data: url
        });
      });
  }
};

const sendAndDeleteRequests = () => {
  return dbRestaurantsPromise.then((db) => {
        var tx = db.transaction('requests', 'readwrite');
        var store = tx.objectStore('requests');

        store.openCursor()
          .then((cursor) => {
            if (!cursor) {
              return;
            } else {
              console.log(cursor.value);
              const url = cursor.value.data;
              const method = cursor.value.requestType;
              cursor.delete();
              if(method === 'PUT') {
                return fetch(url, {method: method})
                  .then((response) => {
                    return response.json();
                  })
                  .then((favorite) => {
                    console.log(favorite);
                    return favorite;
                  })
                  .catch((error) => {
                    console.log(`Request failed. Returned status of ${error}`, null);
                  });
              }
              cursor.continue();
            }
          });
          tx.complete.then(() => {
            console.log('done');
          });
        });
};

const serveRestaurantPhoto = (request) => {
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
