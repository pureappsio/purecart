Template.discount.events({

  'click .delete-discount': function() {
  	Meteor.call('removeDiscount', this._id);
  }

});