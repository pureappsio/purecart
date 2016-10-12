Template.fail.helpers({

  mainPicture: function() {
    return Session.get('mainPicture');
  },
  brandEmail: function() {
  	return Session.get('brandEmail');
  }

});

Template.fail.rendered = function() {

	Meteor.call('getBrandEmail', function(err, data) {

		Session.set('brandEmail', data);

	});

}