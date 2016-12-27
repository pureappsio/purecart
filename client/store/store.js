Template.store.rendered = function() {

  // Get image
  Meteor.call('getTitle', function(err, url) {
  	Session.set('mainPicture', url);
  });

};

Template.store.helpers({

	mainPicture: function() {
		return Session.get('mainPicture');
	},
	products: function() {
		return Products.find({show: true});
	}

});
