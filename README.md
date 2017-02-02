# primo-explore-feedback

## Installation

### setting up the dev environment

if you don't have a `package.json` as part of your view code, go to your package directory (e.g. `/primo-explore/custom/NEWUI_VID`) and run:

```sh
npm init
```

follow the prompts and fill out basic information for your package.

### installing the package

from inside your package directory (e.g. `/primo-explore/custom/NEWUI_VID`), run:

```sh
npm install primo-explore-feedback
```

Set a variable in your code for the feedback services
```javascript
var feedbackServiceURL = 'http://myfeedback.service.com/';
```
