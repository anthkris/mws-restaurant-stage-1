/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://127.0.0.1:${port}`;
  }

  /**
   * Register service worker.
   */
  static registerServiceWorker() {
    if (!navigator.serviceWorker) {
      return;
    }
    navigator.serviceWorker.register('sw_browserified.js').then((reg) => {
      console.log('ServiceWorker registered');
    }).catch((err) => {
      console.log('ServiceWorker failed: ', err);
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback, id) {
    let restaurantToFetch;
    if(id) {
      restaurantToFetch = `${DBHelper.DATABASE_URL}/restaurants/${id}`;
    } else {
      restaurantToFetch = `${DBHelper.DATABASE_URL}/restaurants`;
    }

    return fetch(restaurantToFetch)
      .then((response) => {
        return response.json();
      })
      .then((restaurants) => {
        callback(null, restaurants);
      })
      .catch((error) => {
        callback(`Request failed. Returned status of ${error}`, null);
      });
  }


  /**
     * Fetch all reviews.
   */
  static fetchReviews(callback, restaurantId, id) {
    let reviewToFetch;
    if(restaurantId) {
      reviewToFetch = `${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${restaurantId}`;
    } else if (id) {
      reviewToFetch = `${DBHelper.DATABASE_URL}/reviews/${id}`;
    } else {
      reviewToFetch = `${DBHelper.DATABASE_URL}/reviews`;
    }

    return fetch(reviewToFetch)
      .then((response) => {
        return response.json();
      })
      .then((reviews) => {
        callback(null, reviews);
      })
      .catch((error) => {
        callback(`Request failed. Returned status of ${error}`, null);
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // Fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurant) => {
      if (error) {
        callback(error, null);
      } else {
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    }, id);
  }

  /**
   * Fetch a review by the restaurant ID.
   */
  static fetchReviewsByRestaurantId(restaurantId, callback) {
    // Fetch all reviews with proper error handling.
    DBHelper.fetchReviews((error, reviews) => {
      if (error) {
        callback(error, null);
      } else {
        if (reviews) { // Got the reviews
          callback(null, reviews);
        } else { // Review does not exist in the database
          callback('Reviews do not exist', null);
        }
      }
    }, restaurantId, null);
  }

  /**
   * Fetch a review by its ID.
   */
  static fetchReviewById(id, callback) {
    // Fetch all reviews with proper error handling.
    DBHelper.fetchReviews((error, review) => {
      if (error) {
        callback(error, null);
      } else {
        if (review) { // Got the review
          callback(null, review);
        } else { // Review does not exist in the database
          callback('Review does not exist', null);
        }
      }
    }, null, id);
  }


  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') { // Filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // Filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results, restaurants);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Fetch favorited state of restaurants.
   */
  static fetchFavoriteState(callback) {
    const favorites = `${DBHelper.DATABASE_URL}/restaurants/?is_favorite=true`;

    return fetch(favorites)
      .then((response) => {
        return response.json();
      })
      .then((favoriteList) => {
        callback(null, favoriteList);
      })
      .catch((error) => {
        callback(`Request failed. Returned status of ${error}`, null);
      });
  }

  /**
   * Post reviews.
   */
   static postReviews(formData, allReviews, callback) {
    const reviewUrl = `${DBHelper.DATABASE_URL}/reviews/`;
    let formObject = {};
    console.log(allReviews);

    for (var [key, value] of formData.entries()) { 
      // console.log(key, value);
      formObject[key] = value;
    }
    // Send form data to service worker
    navigator.serviceWorker.controller.postMessage([allReviews, JSON.stringify(formObject)]);

    return fetch(reviewUrl, {
      method: 'POST',
      body: formData
    })
      .then((response) => {
        return response.json();
      })
      .then((review) => {
        callback(null, review);
      })
      .catch((error) => {
        DBHelper.createOfflineDialog(null, 'You appear to be offline. Once your connection is restored, we\'ll sync your reviews.');
        callback(`Request failed. Returned status of ${error}`, null);
      });
   }

   /**
   * Delete reviews.
   */
   static deleteReview(review, allReviews, callback) {
    const reviewUrl = `${DBHelper.DATABASE_URL}/reviews/${review}`;

    // Send form data to service worker
    navigator.serviceWorker.controller.postMessage([allReviews, null]);

    return fetch(reviewUrl, {
      method: 'DELETE'
    })
      .then((response) => {
        return response.json();
      })
      .then((review) => {
        callback(null, review);
      })
      .catch((error) => {
        DBHelper.createOfflineDialog(null, 'You appear to be offline. Once your connection is restored, we\'ll sync your reviews.');
        callback(`Request failed. Returned status of ${error}`, null);
      });
   }

  /**
   * Update favorited state of restaurants.
   */
  static putFavoriteState(id, isFavorite, previousElement, allFavorites) {
    const init = { method: 'PUT'};
    let favoriteUrl;

    if (isFavorite) {
      favoriteUrl = `${DBHelper.DATABASE_URL}/restaurants/${id}/?is_favorite=true`;
    } else {
      favoriteUrl = `${DBHelper.DATABASE_URL}/restaurants/${id}/?is_favorite=false`;
    }
    // Send favorites to service worker
    navigator.serviceWorker.controller.postMessage(allFavorites);

    return fetch(favoriteUrl, init)
      .then((response) => {
        return response.json();
      })
      .then((favorite) => {
        return favorite;
      })
      .catch((error) => {
        DBHelper.createOfflineDialog(previousElement, 'You appear to be offline. Once your connection is restored, we\'ll sync your favorites.');
        console.log(`Request failed. Returned status of ${error}`, null);
      });
  }

  static createOfflineDialog(previousElement, msg) {
    const offlineDialog = document.getElementById('offline-dialog');
    const offlineDialogMessage = document.getElementById('offline-dialog-msg');
    const dismissButton = document.getElementById('dismiss-button');

    offlineDialog.classList.remove('hidden');
    offlineDialogMessage.innerHTML = msg;
    offlineDialog.focus();
    
    // Dismiss button should dismiss dialog and return focus to previous element
    dismissButton.addEventListener('click', function(e) {
      const alert = document.getElementById('offline-dialog');
      alert.classList.add('hidden');
      if(previousElement) {
        previousElement.focus();
      }
    }, false);
  }


  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URLs.
   */
  static imageUrlForRestaurant(restaurant) {
    if (restaurant.photograph == undefined) {
      return (`/images_responsive/10-300_small.jpg`);
    }
    return (`/images_responsive/${restaurant.photograph}-300_small.jpg`);
  }

  static largeSourceUrlForRestaurant(restaurant) {
    if (restaurant.photograph == undefined) {
      return (`/images_responsive/10-800_large.jpg`);
    }
    return (`/images_responsive/${restaurant.photograph}-800_large.jpg`);
  }

  static mediumSourceUrlForRestaurant(restaurant) {
    if (restaurant.photograph == undefined) {
      return (`/images_responsive/10-600_medium.jpg`);
    }
    return (`/images_responsive/${restaurant.photograph}-600_medium.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    });
    return marker;
  }

}
