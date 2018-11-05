# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_

## Project Overview: Stage 1

For stage one of the project, I worked to improve the site via:

- Adding accessibility features, including:
  - Changing the color palette to prevent color contrast issues
  - Adding a skip navigation link
  - Adding alt attributes to all images
  - Adding labels to form elements
  - Using ARIA, where appropriate
- Implementing mobile-first design for all pages using:
  - Flexbox techniques
  - Image srcsets with sizes
  - General design decisions (e.g. to hide the map on the main page on mobile views)
- Implementing an offline-first design through the use of a service worker

## Tools Used

- Grunt to make various image resolutions to be served up
- ESLint and StyleLint to ensure adherence to the Udacity style guides
- WebAIM WAVE and WorldSpace Attest to test for accessibility issues

## Acknowledgements

To help make the site the best I could make it, I used the following resources:

- Intrinsic Ratio for images: To minimize document reflow, I used the technique for defining intrinsic ratios for the images as described here: [Just Markup.com/](https://justmarkup.com/log/2015/11/definining-aspect-ratio-to-prevent-reflow/)
- Skip Nav: I used the recommendations for an accessible skip navigation link from [WebAIM](https://webaim.org/techniques/css/invisiblecontent/#skipnavlink)
- Informing screen reader users of a change in content: When a user filters the restaurants on the main page, a screen reader user would have no way of knowing that the content below had changed based on their filter choices. To fix this issue, I used a technique to announce changes to the user from [Simply Accessible.com](https://simplyaccessible.com/article/spangular-accessibility/#aria)

## Project Overview: Stage 2

In stage two of the project, I added indexedDB to the site to index data delivered from the project sails server.

## Tools Used

- Grunt to allow for the use of node modules in the js
- ESLint to ensure adherence to the Udacity style guides
- Noun Project for a site icon to use with the manifest file

## Acknowledgements

I had a bit of trouble with the indexedDB portion at first. I got over the hump partly with the help of the Udacity webinar by Doug Brown: [https://www.youtube.com/watch?v=Q2CJYf_XA58](https://www.youtube.com/watch?v=Q2CJYf_XA58)

I also used the Google Web Fundamentals article about web manifests to help me build a proper manifest: [https://developers.google.com/web/fundamentals/web-app-manifest/](https://developers.google.com/web/fundamentals/web-app-manifest/)

## Project Overview: Stage 3

In stage three of the project, I updated the app to allow user's to favorite restaurants and write/delete reviews, even if offline.

## Tools Used

- Plain JS for most of the features
- Google static map API
- Idb library cursors to iterate over

## Acknowledgements

One of the first hurdles I faced was trying to meet the Lighthouse performance requirements for the app. For a while now, I'd been interested in what solutions there might be to using Google maps in a progressive web app. While searching, I happened upon a Medium post by [Lorenzo Zaccagnini](https://medium.com/@lorenzozaccagnini/improve-google-map-performance-in-your-pwa-fe24a6b3a37b) which presented several very nice options for getting around the problem. For the home page of the app, it seemed important to maintain the position of the map at the top of the page for users to get an idea of the restaurants' locations, so I opted for the hybrid solution of using the Google static map API to create an image that, when clicked would load the interactive map. On the individual restaurant pages, I opted to simply move the map to the bottom of the page on mobile as it seemed to be much less important than the other page content.

The other major challenge that I faced was in trying to save POST or PUT or DELETE requests and then to send off requests once the user was back online. First, I figured out how to post a message to the service worker to save and reconstruct the requests. As for sending the requests off, I had a timing conundrum at first: No matter what I did, the app would show old data before it updated to the new data. After reviewing the Udacity challenge course and the Wittr app, I came up with the idea to always return to indexeddb data that I was updating as the user performed actions and to update that data and the server in the background by sending off fresh GET requests only when the previous POST, PUT, or DELETE request had returned.

## Getting the App Online

I noticed that one of the project demonstrations was by a nanodegree grad who had managed to deploy his app online. I also wanted to do that, so I looked it up.

The app is now deployed online using Netlify and AWS EC2 for the sails server.

While Netlify was easy to handle, I had to use multiple resources to figure out how and where to enable SSL.

The steps were to:

- Create EC2 Instance
- Configure EC2 instance for proper ports
- Point EC2 instance to domain so that you can generate certificate
- Log into EC2 instance and install node and sails
- Install necessary items for certbot and generate certificates
- Update development or production config in Sails with SSL certificates and new port (443)
- Update project database url with new port and url (Be sure to update any other checks that may have to do with the port or the url!)

### Resources

- Install node and sails on an EC2 instance: [AWS instructions](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-up-node-on-ec2-instance.html) and [this article by Saint Coder](https://saintcoder.wordpress.com/2014/05/29/deploying-sails-js-web-application-on-aws-ec2-instance/)
- Configuring EC2 instance, and installing certbot and generating certificates: [Free Code Camp article by Karan Thakkar](https://medium.freecodecamp.org/going-https-on-amazon-ec2-ubuntu-14-04-with-lets-encrypt-certbot-on-nginx-696770649e76)
- Enable HTTPS on sails:
  - Up-to-date Sails SSL config code: [Sails documentation](https://sailsjs.com/documentation/reference/configuration/sails-config)
  - The appropriate paths to certs generated with Let's Encrypt certbot: https://www.linode.com/docs/security/ssl/install-lets-encrypt-to-create-ssl-certificates/
  - More guidance on the appropriate paths to Let's Encrypt certs: http://ashutoshksingh.com/2017/12/20/https/
 - Ensuring the sails server stayed running: [Saint Coder article](https://saintcoder.wordpress.com/2014/05/29/deploying-sails-js-web-application-on-aws-ec2-instance/)
 - Remembering to change to port in the Sails config: [Article from ProCoefficient blog](http://www.procoefficient.com/blog/implementing-https-in-sailsjs-the-right-way/)

 You can test the app at: [https://ka-mws-project.netlify.com/](https://ka-mws-project.netlify.com/)
 
 ## Updating the Let's Encrypt Cert
 My current steps are to:
 
 - Log into AWS instance
 - Become root on AWS instance
 - As root user, in Applications/mws-restaurant-stage-3 shut down forever instances using `forever stopall`
 - As root user, in home/ubuntu, Renew cert using `./certbot-auto renew`
 - As root user, in Applications/mws-restaurant-stage-3 start forever instance: `forever start -ae errors.log app.js --dev --port 443`

### Note

Current ssl config looks like (in Applications/mws-restaurant-stage-2/config/env/development.js):
```
// For some reason, adding ca key caused errors
module.exports = {
  ssl: {
  key: require('fs').readFileSync('/etc/letsencrypt/live/yourdomain.com/privkey.pem'),
  cert: require('fs').readFileSync('/etc/letsencrypt/live/yourdomain.com/cert.pem')
},
port: 443
};
```
