Template.admin.rendered = function() {

  this.$('.datetimepicker').datetimepicker();

}

Template.admin.events({

  'click #get-vat': function() {

    // Get dates
    var startDate = new Date($('#start-date').val());
    var endDate = new Date($('#end-date').val());

    // Get VAT
    var sales = Sales.find({date: {$lte: endDate, $gte: startDate}}).fetch();
    var vat = 0;
    for (i = 0; i < sales.length; i++) {
      vat = vat + sales[i].tax;
    }
    $('#vat').text(vat);

  },
  'click #add-product': function() {

  	// Get info
  	product = {
  	  name: $('#product-name').val(),
  	  price: {
        EUR: parseFloat($('#product-price-eur').val()),
        USD: parseFloat($('#product-price-usd').val())
      },
      url: $('#product-url').val()
  	};

  	// Add
  	Meteor.call('addProduct', product);

  },
  'click #set-title': function() {

    // Add
    Meteor.call('setTitle', $('#title-picture').val());

  },
  'click #set-brand-data': function() {

    // Add
    Meteor.call('setBrandData', $('#brand-name').val(), $('#brand-email').val());

  }

});

Template.admin.helpers({

  products: function() {
  	return Products.find({});
  },
  sales: function() {
    return Sales.find({});
  }

});

