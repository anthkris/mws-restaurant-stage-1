let restaurant;
let reviews;
let map;
let restaurantId;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // Restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  restaurantId = getParameterByName('id');
  if (!restaurantId) { // No id found in URL
    const error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(restaurantId, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.srcset = `
    ${DBHelper.imageUrlForRestaurant(restaurant)} 300w,
    ${DBHelper.mediumSourceUrlForRestaurant(restaurant)} 600w,
    ${DBHelper.largeSourceUrlForRestaurant(restaurant)} 800w
  `;
  image.sizes = '(min-width: 750px) 40vw, 90vw';
  image.alt = restaurant.name;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // Fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }

  DBHelper.fetchReviewsByRestaurantId(restaurantId, (error, reviews) => {
    self.reviews = reviews;
    if (!reviews) {
      console.error(error);
      return;
    }
    createReviewForm(restaurant.id);
    // Fill reviews
    fillReviewsHTML(reviews);
  });

  
  
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

createReviewForm = (restaurant) => {
  const container = document.getElementById('review-form-container');

  const addReviewTitle = document.createElement('h2');
  addReviewTitle.innerHTML = 'Add a Review';
  container.appendChild(addReviewTitle);

  const instructionText = document.createElement('small');
  instructionText.innerHTML = 'Asterisk(*) indicates required field.';
  container.appendChild(instructionText);

  const reviewForm = document.createElement('form');
  reviewForm.setAttribute('id', 'review-form');
  reviewForm.setAttribute('method', 'POST');
  reviewForm.setAttribute('role', 'form');

  const restaurantID = document.createElement('input');
  restaurantID.setAttribute('type', 'hidden');
  restaurantID.setAttribute('id', 'restaurant_id');
  restaurantID.setAttribute('name', 'restaurant_id');
  restaurantID.setAttribute('value', restaurant);
  reviewForm.appendChild(restaurantID);

  const nameLabel = document.createElement('label');
  nameLabel.setAttribute('for', 'name');
  nameLabel.innerHTML = 'Name*';
  reviewForm.appendChild(nameLabel);

  const nameInput = document.createElement('input');
  nameInput.setAttribute('id', 'name');
  nameInput.setAttribute('maxLength', '200');
  nameInput.setAttribute('name', 'name');
  nameInput.setAttribute('type', 'text');
  nameInput.setAttribute('required', true);
  reviewForm.appendChild(nameInput);

  const ratingLabel = document.createElement('label');
  ratingLabel.setAttribute('for', 'rating');
  ratingLabel.innerHTML = 'Rating*';
  reviewForm.appendChild(ratingLabel);

  const ratingInput = document.createElement('input');
  ratingInput.setAttribute('id', 'rating');
  ratingInput.setAttribute('min', '1');
  ratingInput.setAttribute('max', '5');
  ratingInput.setAttribute('name', 'rating');
  ratingInput.setAttribute('type', 'number');
  ratingInput.setAttribute('required', true);
  reviewForm.appendChild(ratingInput);

  const reviewLabel = document.createElement('label');
  reviewLabel.setAttribute('for', 'user-review');
  reviewLabel.innerHTML = 'Review*';
  reviewForm.appendChild(reviewLabel);

  const reviewInput = document.createElement('textarea');
  reviewInput.setAttribute('id', 'comments');
  reviewInput.setAttribute('name', 'comments');
  reviewInput.setAttribute('rows', '4');
  reviewInput.setAttribute('cols', '50');
  reviewInput.setAttribute('required', true);
  reviewForm.appendChild(reviewInput);

  const reviewSubmit = document.createElement('input');
  reviewSubmit.setAttribute('id', 'submit-review');
  reviewSubmit.setAttribute('value', 'Add Review');
  reviewSubmit.setAttribute('type', 'submit');

  reviewForm.addEventListener('submit', (event) => {
    postRequest(event, reviewForm);
  }, false);

  reviewForm.appendChild(reviewSubmit);
  container.appendChild(reviewForm);

};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  if (review.id) {
    li.setAttribute('id', `review-${review.id}`);
  }
  
  const name = document.createElement('p');
  name.className = 'reviewer-name';
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('span');
  date.innerHTML = convertToDate(review.createdAt);
  date.className = 'review-date';
  name.appendChild(date);

  const reviewBox = document.createElement('div');
  reviewBox.className = 'review-container';
  li.appendChild(reviewBox);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.className = 'restaurant-rating';
  reviewBox.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.className = 'review-comments';
  reviewBox.appendChild(comments);

  // Only add delete button if review was posted while online and has an id
  if (review.id) {
    const deleteButton = document.createElement('button');
    deleteButton.setAttribute('id', 'delete-review');
    deleteButton.innerHTML = 'Delete';
    deleteButton.addEventListener('click', (event) => {
      event.preventDefault();
      if (review.id) {
        deleteReview(review.id);
      } else {
        deleteReview(review.createdAt);
      }
      
      return false;
    }, false);

    reviewBox.appendChild(deleteButton);
  }

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url) {
    url = window.location.href;
  }
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) {
    return null;
  }
  if (!results[2]) {
    return '';
  }
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

/**
 * Convert to date string.
 * Based on https://stackoverflow.com/questions/11591854/format-date-to-mm-dd-yyyy-in-javascript
 */
convertToDate = (time) => {
  const date = new Date(time);
  let wordMonth;

  switch (date.getMonth()) {
    case 0:
      wordMonth = 'January';
      break;
    case 1:
      wordMonth = 'February';
      break;
    case 2:
      wordMonth = 'March';
      break;
    case 3:
      wordMonth = 'April';
      break;
    case 4:
      wordMonth = 'May';
      break;
    case 5:
      wordMonth = 'June';
      break;
    case 6:
      wordMonth = 'July';
      break;
    case 7:
      wordMonth = 'August';
      break;
    case 8:
      wordMonth = 'September';
      break;
    case 9:
      wordMonth = 'October';
      break;
    case 10:
      wordMonth = 'November';
      break;
    case 11:
      wordMonth = 'December';
      break;
  }

  const dateString = `${wordMonth} ${date.getDate()}, ${date.getFullYear()}`;
  return dateString;
};

/**
 * Reset form.
 * Based on https://stackoverflow.com/questions/6028576/how-to-clear-a-form#6029442
 */
resetForm = (form) => {
  const inputs = form.getElementsByTagName('input');
  const textareas = form.getElementsByTagName('textarea');

  for (let i = 0; i < inputs.length; i++) {
    switch (inputs[i].type) {
      case 'text':
        inputs[i].value = '';
        break;
      case 'number':
        inputs[i].value = null;
        break;
      case 'submit':
        break;
      case 'hidden':
        break;
      default:
        inputs[i].value = '';
    }
  }

  for (let j = 0; j < textareas.length; j++) {
    textareas[j].value = '';
  }
};

/**
 * Create success alert on successful delete or post
 */
createSuccessAlert = (msg, success, id, position) => {
  const reviewContainer = document.getElementById('reviews-container');
  const addReviewContainer = document.getElementById('review-form-container');

  // Only create an alert if one is not already existing
  if (document.getElementById(id) === null) {
    const successAlert = document.createElement('div');
    if (success) {
      successAlert.style.background = '#d4edda';
    } else {
      successAlert.style.background = '#f8d7da';
    }
    successAlert.setAttribute('id', id);
    successAlert.setAttribute('class', 'success-alert');
    successAlert.setAttribute('role', 'alertdialog');
    successAlert.setAttribute('aria-live', 'assertive');
    successAlert.setAttribute('tabIndex', 0);

    const successAlertMessage = document.createElement('p');
    successAlertMessage.innerHTML = msg;
    successAlert.appendChild(successAlertMessage);

    const successAlertButtonGroup = document.createElement('div');
    successAlertButtonGroup.setAttribute('class', 'success-alert-dialog-button');
    successAlert.appendChild(successAlertButtonGroup);

    const successAlertDimiss = document.createElement('button');
    successAlertDimiss.setAttribute('class', 'success-alert-dismiss');
    successAlertDimiss.innerHTML = 'DISMISS';
    successAlertDimiss.addEventListener('click', (event) => {
      successAlert.parentNode.removeChild(successAlert);
    });
    successAlertButtonGroup.appendChild(successAlertDimiss);

    switch (position) {
      case 'add':
        addReviewContainer.insertBefore(successAlert, addReviewContainer.firstChild);
        break;
      case 'delete':
        reviewContainer.insertBefore(successAlert, reviewContainer.firstChild);
        break;
    }
    
    successAlert.focus();
  }
  
};

/**
 * POST review.
 */
postRequest = (event, form) => {
  const formData = new FormData(form);
  const ul = document.getElementById('reviews-list');
  const now = Date.now();
  let formObject = {};

  event.preventDefault();

  // Create form object for offline use
  for (var [key, value] of formData.entries()) { 
    formObject[key] = value;
  }

  // Can still update and show new reviews, if offline
  const reviewObject = {
        restaurant_id: formObject.restaurant_id,
        createdAt: now,
        updatedAt: now,
        name: formObject.name,
        rating: formObject.rating,
        comments: formObject.comments
      };
  updateReviews('add', null, reviewObject);

  DBHelper.postReviews(formData, self.reviews, (error, review) => {
    if (error) {
      // Can still update and show new reviews, if offline
      ul.appendChild(createReviewHTML(reviewObject));
      resetForm(form);
      return;
    }

    // updateReviews('add', null, review);
    createSuccessAlert('Your review has been added successfully',true,'success-post-alert','add');
    ul.appendChild(createReviewHTML(review));
    resetForm(form);
  });
  
};

/**
 * Delete review.
 */
deleteReview = (reviewId) => {
  const reviewLi = document.getElementById(`review-${reviewId}`);

  // Can still delete and update UI, if offline
  updateReviews('delete', reviewId);

  DBHelper.deleteReview(reviewId, self.reviews, (error, review) => {
    if (error) {
      reviewLi.parentNode.removeChild(reviewLi);
      return;
    }
    // If online, then show success alert
    createSuccessAlert('Your review has been deleted successfully.',true,'success-delete-alert','delete');
    reviewLi.parentNode.removeChild(reviewLi);
  });
};

updateReviews = (action, id, data = {}) => {
  switch (action) {
    case 'add':
      self.reviews.push({
        restaurant_id: data.restaurant_id,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        name: data.name,
        rating: data.rating,
        comments: data.comments
      });
      break;
    case 'delete':
      self.reviews.find((review, index) => {
        if(review.id === id) {
          return self.reviews.splice(index, 1);
        }
      });
      break;
    case 'update':
      break;
  }
};