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

		var products = Products.find({show: true}, {sort: { _id : -1 }}).fetch();

		var storeProductsRow = [];
		groupIndex = 0;

		for (i = 0; i < products.length; i + 3) {

			storeProductsRow[groupIndex] = products.splice(i, i+3);
			groupIndex++;

		}

		console.log(storeProductsRow);

		return storeProductsRow;
	}

});
