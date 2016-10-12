Template.sale.events({

  'click .delete-sale': function() {
  	Meteor.call('removeSale', this._id);
  }

});

Template.sale.helpers({

  startCurrency: function() {
    if (this.currency == 'USD') {
      return '$';
    }
    else {
      return '';
    }
  },
  endCurrency: function() {
    if (this.currency == 'EUR') {
      return '€';
    }
    else {
      return '';
    }
  }

});
