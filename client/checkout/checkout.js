Session.set('paymentFormStatus', null);
var isBraintreeInitialized = false;

Template.checkout.rendered = function() {

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

  // Get image
  Meteor.call('getTitle', function(err, url) {
  	Session.set('mainPicture', url);
  });

  // Init Braintree
  Meteor.call('getClientToken', function (err, clientToken) {

    if (err) {
      console.log('There was an error', err);
      return;
    }

    // Init
    initializeBraintree(clientToken);
    
  });

}

Template.checkout.helpers({

	paymentFormStatusClass: function () {
      return Session.get('paymentFormStatus') ? 'payment-form__is-submitting' : '';
  	},
	mainPicture: function() {
		return Session.get('mainPicture');
	},
	useTaxes: function() {
		return Session.get('useTaxes');
	},
	basePrice: function() {
	  if (Session.get('useTaxes') == false) {
	  	return this.price[Session.get('currency')];
	  }
	  else {
	  	return (this.price[Session.get('currency')] / (1 + Session.get('tax')/100)).toFixed(2);
	  }
	  
	},
	taxes: function() {
	  return (this.price[Session.get('currency')] - (this.price[Session.get('currency')] / (1 + Session.get('tax')/100)).toFixed(2)).toFixed(2);
	},
	total: function() {
	  return this.price[Session.get('currency')];
	},
	dataIssue: function() {
		return Session.get('dataIssue');
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

Template.checkout.events({

});

function initializeBraintree (clientToken) {
  if (isBraintreeInitialized) return;

  braintree.setup(clientToken, 'dropin', {
    container: 'dropin',
    onPaymentMethodReceived: function (response) {
      Session.set('paymentFormStatus', true);

      // Send to server
      var saleData = {
        firstName: $('#first-name').val(),
  		lastName: $('#last-name').val(),
  		email: $('#email').val()
      }
      saleData.nonce = response.nonce;

      if (saleData.email == "") {

  	    Session.set('dataIssue', true);

  	  }
  	  if (saleData.lastName == "") {

  		Session.set('dataIssue', true);
  		
  	  }
  	  if (saleData.firstName == "") {

  		Session.set('dataIssue', true);
  		
  	  }

  	  // Product & sales info
      saleData.subtotal = parseFloat($('#subtotal').text());
      if ($('#tax').text() == "") {
        saleData.tax = 0;
      }
      else {
        saleData.tax = parseFloat($('#tax').text());
      }
  	  saleData.amount = parseFloat($('#total-price').text());
  	  saleData.productId = $('#product-id').text();
      saleData.currency = Session.get('currency');

  	  if (saleData.email != "" && saleData.lastName != "" && saleData.firstName != "") {

  		Session.set('dataIssue', false);

  		Meteor.call('purchaseProduct', saleData, function (err, sale) {
	        Session.set('paymentFormStatus', null);
	        if (sale.success == true) {
	          Router.go("/purchase_confirmation?sale_id=" + sale._id);
	        }
          if (sale.success == false) {
            Router.go("/failed_payment");
          }

	    });

  	  }
    }
  });

  isBraintreeInitialized = true;
}

