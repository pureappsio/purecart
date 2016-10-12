Template.product.events({

  'click .delete-product': function() {
  	Meteor.call('removeProduct', this._id);
  }

});
