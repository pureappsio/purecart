Template.cartItem.events({
  
  'click .remove-item': function() {

    // Get cart
    var cart = Session.get('cart');

    console.log(this);
    console.log(cart);

    // Remove item
    for (i = 0; i < cart.length; i++) {
      if (cart[i]._id == this._id) {
        cart.splice(i, 1);
        break;
      }
    }

    // Update cart
    Session.set('cart', cart);

  }

});

Template.cartItem.helpers({

  useTaxes: function() {
    return Session.get('useTaxes');
  },

  basePrice: function() {

    var basePrice = 0;

    // Calculate base price
    if (Session.get('useTaxes') == false) {
      basePrice = this.price[Session.get('currency')];
    }
    else {
      basePrice = this.price[Session.get('currency')] / (1 + Session.get('tax')/100);
    }
    
    // Apply discount
    if (Session.get('usingDiscount')) {
      basePrice = basePrice * (1 - Session.get('usingDiscount').amount/100);
    }

    return basePrice.toFixed(2);
  },
  taxes: function() {

    var tax = this.price[Session.get('currency')] - (this.price[Session.get('currency')] / (1 + Session.get('tax')/100)).toFixed(2);

    // Apply discount
    if (Session.get('usingDiscount')) {
      tax = tax * (1 - Session.get('usingDiscount').amount/100);
    }

    return tax.toFixed(2);
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
  }

});