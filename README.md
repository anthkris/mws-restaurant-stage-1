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
