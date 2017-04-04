Template.fail.helpers({

  mainPicture: function() {
    return Session.get('mainPicture');
  },
  brandEmail: function() {
  	return Session.get('brandEmail');
  }

});

Template.fail.rendered = function() {

	// Brand email
	// Meteor.call('getBrandEmail', function(err, data) {

	// 	Session.set('brandEmail', data);

	// });

	// // Get image
	//   Meteor.call('getTitle', function(err, url) {
	//   	Session.set('mainPicture', url);
	//   });

}