import idb from 'idb';

const STATICCACHENAME = 'mws-reviews-static-v4';
const CONTENTIMGSCACHE = 'mws-restaurant-imgs';
const ALLCACHES = [
  STATICCACHENAME,
  CONTENTIMGSCACHE
];

const dbRestaurantsPromise = idb.default.open('mws-restaurant-data', 2, (upgradeDB) => {
  switch (upgradeDB.oldVersion) {
    case 0:
      upgradeDB.createObjectStore('restaurants', { keyPath: 'id' });
      upgradeDB.createObjectStore('reviews', { keyPath: 'restaurant_id' });
      upgradeDB.createObjectStore('requests', { keyPath: 'id', autoIncrement:true });
      upgradeDB.createObjectStore('favorites', { keyPath: 'id' });
  }
});

let currentFavorites,
    reviewData,
    reviewToPost;

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

self.addEventListener('message', (event) => {
  // Update favorites or review for storage in idb object store
  if(event.data[0].hasOwnProperty('is_favorite')) {
    currentFavorites = event.data;
  } else {
    reviewData = event.data[0];
    reviewToPost = event.data[1];
  }
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

  // console.log(requestUrl);

  /* Based on the Doug Brown live webinar solution */
  if (requestUrl.hostname === 'api.knanthony.com' && request.method !== 'GET') {
    handlePutAndPostRequest(requestUrl, event);
  } else if (requestUrl.hostname === 'api.knanthony.com' && requestUrl.pathname.startsWith('/restaurants')) {
    handleRestaurantDataRequest(requestUrl, event);
  } else if (requestUrl.hostname === 'api.knanthony.com' && requestUrl.pathname.startsWith('/reviews')) {
    handleReviewDataRequest(requestUrl, event);
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});

const fetchAndUpdateFavorites = (event, id) => {
  return fetch(event.request).then((response) => {
      return response.json();
    }).then((json) => {
      return dbRestaurantsPromise.then((db) => {
        var tx = db.transaction('favorites', 'readwrite');
        var store = tx.objectStore('favorites').put({
          id: id,
          data: json
        });
        return json;
      });
    });
};

const fetchAndUpdateReviews = (event, id) => {
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
};

const handleRestaurantDataRequest = (requestUrl, event) => {
  const params = requestUrl.pathname.split('/');
  const query = new URLSearchParams(requestUrl.search.slice(1));
  let id;

  if(params.length > 2) {
    id = params[2];
  } else {
    id = '-1';
  }

  if(query.has('is_favorite')) {
      event.respondWith(dbRestaurantsPromise.then((db) => {
        return db.transaction('favorites', 'readonly').objectStore('favorites').get(id);
      }).then((data) => {
        if (data && data.data) {
          if (navigator.onLine) {
            // Update favorites in the background
            sendAndDeleteRequests(event, id, 'favorites');
          }
          return data.data;
        } else {
          return fetch(event.request).then((response) => {
            return response.json();
          }).then((json) => {
            return dbRestaurantsPromise.then((db) => {
              var tx = db.transaction('favorites', 'readwrite');
              var store = tx.objectStore('favorites').put({
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
  } else {
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
  }
  
};

const handleReviewDataRequest = (requestUrl, event) => {
  const params = requestUrl.searchParams;
  const id = params.get('restaurant_id');

  event.respondWith(dbRestaurantsPromise.then((db) => {
        return db.transaction('reviews', 'readonly').objectStore('reviews').get(id);
      }).then((data) => {
        if (data && data.data) {
          if (navigator.onLine) {
            // Update reviews in the background
            sendAndDeleteRequests(event, id, 'reviews');
          }
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
  const params = requestUrl.pathname.split('/');
  const query = new URLSearchParams(requestUrl.search.slice(1));
  let restaurantId;
  let id;

  if(reviewData !== undefined) {
    restaurantId = reviewData[0]['restaurant_id'].toString();
  }

  if(params.length > 2) {
    id = params[2];
  } else {
    id = '-1';
  }

  // If offline, save POST requests to requests store
  // And update reviews store

  if(!navigator.onLine && method === 'POST') {
    return dbRestaurantsPromise.then((db) => {
      var requestTx = db.transaction('requests', 'readwrite');
      var requestStore = requestTx.objectStore('requests').put({
        requestType: method,
        data: url,
        body: reviewToPost
      });

      var reviewTx = db.transaction('reviews', 'readwrite');
      var reviewStore = reviewTx.objectStore('reviews');
      reviewStore.put({
        restaurant_id: restaurantId,
        data: reviewData
      }); 
    });
  }

  // If offline, save DELETE requests to requests store
  // And update reviews store

  if(!navigator.onLine && method === 'DELETE') {
    return dbRestaurantsPromise.then((db) => {
      var requestTx = db.transaction('requests', 'readwrite');
      var requestStore = requestTx.objectStore('requests').put({
        requestType: method,
        data: url
      });

      var reviewTx = db.transaction('reviews', 'readwrite');
      var reviewStore = reviewTx.objectStore('reviews');
      reviewStore.put({
        restaurant_id: restaurantId,
        data: reviewData
      }); 
    });
  }

  // If offline, save favorite PUT requests to requests store
  // And update favorites store

  if(!navigator.onLine && method === 'PUT' && query.has('is_favorite')) {
    return dbRestaurantsPromise.then((db) => {
      var requestTx = db.transaction('requests', 'readwrite');
      var requestStore = requestTx.objectStore('requests').put({
        requestType: method,
        data: url
      });

      var favoriteTx = db.transaction('favorites', 'readwrite');
      var favoriteStore = favoriteTx.objectStore('favorites');
      favoriteStore.put({
        id: '',
        data: currentFavorites
      }); 
    });
  }
};

const sendAndDeleteRequests = (event, id, type) => {
  return dbRestaurantsPromise.then((db) => {
    var tx = db.transaction('requests', 'readwrite');
    var store = tx.objectStore('requests');

    store.iterateCursor(cursor => {
      if (!cursor) {
        if (type === 'favorites') {
          fetchAndUpdateFavorites(event, id);
        } else if (type === 'reviews') {
          fetchAndUpdateReviews(event, id);
        }
        return;
      }
      const url = cursor.value.data;
      const method = cursor.value.requestType;
      const body = cursor.value.body;
      let options = {};

      cursor.delete();
      if(method === 'PUT' || method === 'DELETE') {
        options = {method: method};
      } else if (method === 'POST') {
        options = {
          method: method,
          body: body
        };
      }
      cursor.continue();

      return fetch(url, options)
        .then((response) => {
          return response.json();
        })
        .then((item) => {
          if (type === 'favorites') {
            fetchAndUpdateFavorites(event, id);
          } else if (type === 'reviews') {
            fetchAndUpdateReviews(event, id);
          }
          // return item;
        })
        .catch((error) => {
          console.log(`Request failed. Returned status of ${error}`, null);
        });
    });
    return tx.complete;
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
