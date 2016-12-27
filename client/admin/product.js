Template.product.events({

  'click .delete-product': function() {
  	Meteor.call('removeProduct', this._id);
  }

});

Template.product.helpers({

  isBundle: function() {
    if (this.bundledProducts) {
      return true;
    }
    else {
      return false;
    }
  },
  sessions: function() {
  	return Sessions.find({productId: this._id}).fetch().length;
  },
  sales: function() {
  	return Sales.find({
      products: { 
        $elemMatch: { $eq: this._id }
      }
    }).fetch().length;
  },
  conversions: function() {
  	if (Sessions.find({productId: this._id}).fetch().length != 0) {
  	  return (Sales.find({productId: this._id}).fetch().length/Sessions.find({productId: this._id}).fetch().length*100).toFixed(2);
  	}
  	else {
  	  return 0;
  	}
  }

});
