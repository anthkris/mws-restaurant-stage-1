let restaurants,
  neighborhoods,
  cuisines,
  favoriteRestaurants;
var map;
var markers = [];
const heartOutlineSVG = '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" fill="#034078" version="1.1" x="0px" y="0px" viewBox="0 0 100 100"><g transform="translate(0,-952.36218)"><path style="text-indent:0;text-transform:none;direction:ltr;block-progression:tb;baseline-shift:baseline;color:#000000;enable-background:accumulate;" d="m 35.310596,972.39274 c -4.737999,0 -9.493707,1.85967 -13.03125,5.59378 -7.075159,7.4679 -7.064843,19.372 0,26.84368 l 24.78125,26.25 a 4.0004,4.0004 0 0 0 5.8125,0 c 8.271592,-8.7311 16.57209,-17.4873 24.84375,-26.2187 7.07514,-7.46798 7.07502,-19.37558 0,-26.84378 -7.07504,-7.46821 -18.956127,-7.46836 -26.03125,0 l -1.6875,1.7813 -1.6875,-1.8125 c -3.537574,-3.7341 -8.262001,-5.59378 -13,-5.59378 z m 0,7.84378 c 2.571339,0 5.124214,1.1033 7.1875,3.2812 l 4.625,4.8438 a 4.0004,4.0004 0 0 0 5.78125,0 l 4.5625,-4.8438 c 4.126557,-4.3559 10.311,-4.3558 14.4375,0 4.12652,4.3559 4.1264,11.4883 0,15.8438 -7.304137,7.71008 -14.602064,15.44628 -21.90625,23.15618 l -21.90625,-23.15618 a 4.0004,4.0004 0 0 0 0,-0.031 c -4.125897,-4.3635 -4.126381,-11.4571 0,-15.8125 2.063247,-2.1779 4.647411,-3.2813 7.21875,-3.2813 z" fill="#034078" fill-opacity="1" stroke="none" marker="none" visibility="visible" display="inline" overflow="visible"/></g></svg>';
const heartFilledSVG = '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" fill="#034078" version="1.1" x="0px" y="0px" viewBox="0 0 100 100"><g transform="translate(0,-952.36218)"><path d="m 25.198553,980.79613 c -5.60077,5.9117 -5.59537,15.42487 0,21.34247 l 24.78604,26.2236 c 8.27161,-8.7311 16.54322,-17.462 24.81483,-26.1934 5.60077,-5.9117 5.60077,-15.43043 0,-21.34244 -5.60077,-5.91203 -14.61863,-5.91215 -20.21947,0 l -4.56663,4.82028 -4.59527,-4.85051 c -5.60086,-5.91196 -14.61871,-5.91196 -20.2195,0 z" style="color:#000000;enable-background:accumulate;" fill="#034078" stroke="none" marker="none" visibility="visible" display="inline" overflow="visible"/></g></svg>';

/**
 * Fetch neighborhoods and cuisines and register ServiceWorker as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  const swapMapButton = document.getElementById('swap-map-button');

  fetchFavorites();
  fetchNeighborhoods();
  fetchCuisines();

  swapMapButton.addEventListener('click', function(e) {
    swapMap();
  }, false);

  DBHelper.registerServiceWorker();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Fetch favorite restaurants.
 */
fetchFavorites = () => {
  DBHelper.fetchFavoriteState((error, favorites) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.favoriteRestaurants = favorites;
      return favorites;
    }
  });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });

  updateRestaurants();
};

/**
 * Initialize Google map.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');
  const filteredRestaurantNum = document.getElementById('restaurants-filtered');
  const totalRestaurantNum = document.getElementById('restaurants-total');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants, total) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
      filteredRestaurantNum.innerHTML = restaurants.length;
      totalRestaurantNum.innerHTML = total.length;
    }
  });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 * Update static map image in case more restaurants are added to db.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  const staticMap = document.getElementById('static-map');
  let staticMapSrc = 'https://maps.googleapis.com/maps/api/staticmap?zoom=11&size=640x381&format=jpg&scale=2&maptype=roadmap&markers=color:red%7C';

  restaurants.forEach(restaurant => {
    const latlng = `${restaurant.latlng.lat},${restaurant.latlng.lng}%7C`;
    staticMapSrc += latlng;
    ul.append(createRestaurantHTML(restaurant));
  });
  staticMapSrc += '&key=AIzaSyDsAIccvKJoROAk6zDuhOWBlgWlNu8V5XA';
  staticMap.setAttribute('src', staticMapSrc);
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  li.className = 'columns';

  const imageDivLink = document.createElement('a');
  imageDivLink.href = DBHelper.urlForRestaurant(restaurant);

  const imageDiv = document.createElement('div');
  imageDiv.className = 'aspect-ratio-container';

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.srcset = `
    ${DBHelper.imageUrlForRestaurant(restaurant)} 300w,
    ${DBHelper.mediumSourceUrlForRestaurant(restaurant)} 600w,
    ${DBHelper.largeSourceUrlForRestaurant(restaurant)} 800w
  `;
  image.sizes = '(min-width: 800px) 40vw, (min-width: 1032px) 20vw, 60vw';
  image.alt = restaurant.name;
  imageDiv.append(image);
  imageDivLink.append(imageDiv);
  li.append(imageDivLink);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const buttonDiv = document.createElement('div');
  buttonDiv.className = 'restaurant-card-action-div';
  li.append(buttonDiv);

  const more = document.createElement('a');
  more.className = 'right-align';
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  buttonDiv.append(more);

  const favoriteButton = document.createElement('button');
  favoriteButton.className = 'favorite-button ';
  favoriteButton.setAttribute('role', 'button');

  const isFavorite = self.favoriteRestaurants.some((favorite) => {
    return favorite.id === restaurant.id;
  });

  if(isFavorite) {
    favoriteButton.className += 'favorited';
    favoriteButton.setAttribute('aria-label', 'favorite this restaurant');
    favoriteButton.innerHTML = heartFilledSVG;
  } else {
    favoriteButton.className += 'unfavorited';
    favoriteButton.setAttribute('aria-label', 'unfavorite this restaurant');
    favoriteButton.innerHTML = heartOutlineSVG;
  }
  
  
  buttonDiv.append(favoriteButton);

  favoriteButton.addEventListener('click', function(e) {
    toggleFavoriteRestaurant(e, restaurant.id);
  }, false);

  return li;
};

toggleFavoriteRestaurant = (event, id) => {
  const favoriteButton = event.currentTarget;

  if (favoriteButton.classList.contains('unfavorited')) {
    favoriteButton.innerHTML = heartFilledSVG;
    favoriteButton.classList.remove('unfavorited');
    favoriteButton.classList.add('favorited');
    updateFavoriteRestaurants(true, id);
    favoriteButton.setAttribute('aria-label', 'unfavorite this restaurant');
    DBHelper.putFavoriteState(id, true, favoriteButton, self.favoriteRestaurants);
  } else {
    favoriteButton.innerHTML = heartOutlineSVG;
    favoriteButton.classList.remove('favorited');
    favoriteButton.classList.add('unfavorited');
    updateFavoriteRestaurants(false, id);
    favoriteButton.setAttribute('aria-label', 'favorite this restaurant');
    DBHelper.putFavoriteState(id, false, favoriteButton, self.favoriteRestaurants);
  }
};

updateFavoriteRestaurants = (isFavorite, id) => {
  if (isFavorite) {
    const exists = self.favoriteRestaurants.find((fav) => {
      if(fav.id === id) {
        fav.is_favorite = 'true';
        return fav.id === id;
      }
    });

    if (!exists) {
      self.favoriteRestaurants.push({
        id: id,
        is_favorite: 'true'
      });
    }
  } else {
    self.favoriteRestaurants.find((fav, index) => {
      if(fav.id === id) {
        return self.favoriteRestaurants.splice(index, 1)
      }
    });
  }
};

/**
 * Add markers for current restaurants to the map.
*/
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url;
    });
    self.markers.push(marker);
  });
};

/**
 * Swap out static map for interactive map.
*/
swapMap = () => {
  const staticMap = document.getElementById('static-map');
  const swapMapButton = document.getElementById('swap-map-button');
  const mapMessage = document.getElementById('map-message');
  const interactiveMap = document.getElementById('map');

  initMap();
  addMarkersToMap();

  staticMap.classList.add('hidden');
  swapMapButton.classList.add('hidden');
  mapMessage.classList.add('hidden');
  interactiveMap.classList.remove('hidden');
};

