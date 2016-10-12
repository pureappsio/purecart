Template.registerHelper("truncate", function (number) {
    return number.toFixed(0);
});

Template.registerHelper("truncateTwo", function (number) {
    return number.toFixed(2);
});

Template.registerHelper("isAdmin", function () {
  if (Meteor.user().emails[0].address == 'marcolivier.schwartz@gmail.com') {
     return true;
  }
  else {
    return false;
  }
});