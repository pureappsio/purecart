Template.cart.rendered = function() {

   // Check language
  Meteor.call('checkLanguage', function(err, data) {

    Session.set('language', data);

  });

  // Get image
  Meteor.call('getTitle', function(err, url) {
    Session.set('mainPicture', url);
  });

  // Get location of visitor
  Meteor.call('getUserLocation', function(err, data) {

    if (err) {
      console.log(err);
      Session.set('useTaxes', false);
      Session.set('currency', 'USD');
    }
    else {

        var country_code = data.country_code;
 
      Meteor.call('isEuropeanCustomer', country_code, function(err, data) {
        
        if (data) {
          Session.set('useTaxes', true);
          Session.set('currency', 'EUR');

          Meteor.call('getVAT', country_code, function(err, data) {

            Session.set('tax', data);

          });

        }
        else {
          Session.set('useTaxes', false);
          Session.set('currency', 'USD');
        }

      });

    }
  
  }); 

};  

Template.cart.events({

  'click #checkout': function() {
    Router.go('/checkout');
  }

});

Template.cart.helpers({

  useTaxes: function() {
    return Session.get('useTaxes');
  },

  taxes: function() {

    // Get cart
    var cart = Session.get('cart');
    var tax = 0;

    // Calculate total
    for (i = 0; i < cart.length; i++) {
      tax = tax + cart[i].price[Session.get('currency')] - (cart[i].price[Session.get('currency')] / (1 + Session.get('tax')/100)).toFixed(2);
    }

    // Apply discount
    if (Session.get('usingDiscount')) {
      tax = tax * (1 - Session.get('usingDiscount').amount/100);
    }

    return tax.toFixed(2);
  },
  total: function() {

    // Get cart
    var cart = Session.get('cart');
    var total = 0;

    // Calculate total
    for (i = 0; i < cart.length; i++) {
      total = total + cart[i].price[Session.get('currency')];
    }

    // Apply discount
    if (Session.get('usingDiscount')) {
      total = total * (1 - Session.get('usingDiscount').amount/100);
    }

    return total.toFixed(2);
  },

  startCurrency: function() {
    if (Session.get('currency') == 'USD') {
      return '$';
    }
    else {
      return '';
    }
  },
  endCurrency: function() {
    if (Session.get('currency') == 'EUR') {
      return '€';
    }
    else {
      return '';
    }
  },

  mainPicture: function() {
    return Session.get('mainPicture');
  },
  products: function() {
    return Session.get('cart');
  }

});