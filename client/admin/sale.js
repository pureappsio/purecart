Template.sale.events({

  'click .delete-sale': function() {
  	Meteor.call('removeSale', this._id);
  },
  'click .send-invoice': function() {
    var sale = Sales.findOne(this._id);
    Meteor.call('sendReceipt', sale);
  }

});

Template.sale.helpers({

  formatedDate: function() {
    var date = new Date(this.date);
    return date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
  },
  status: function() {
    if (this.success == true) {
      return 'Paid';
    }
    if (this.success == false) {
      return 'Canceled';
    }
  },

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
