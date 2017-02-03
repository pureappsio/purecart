Session.set('paymentFormStatus', null);
var isBraintreeInitialized = false;

Template.checkoutPayment.rendered = function() {

    console.log(Session.get('affiliateCode'));

    // Reset status of payment
    Session.set('paymentStatus', false);

    // Count visits
    var products = Session.get('cart');

    for (i = 0; i < products.length; i++) {

        session = {
            date: new Date(),
            productId: products[i]._id,
            type: 'checkout'
        };

        Meteor.call('insertSession', session);

    }

    // Check language
    Meteor.call('checkLanguage', function(err, data) {

        Session.set('language', data);

    });

    // Check payment type
    Meteor.call('getPayment', function(err, paymentType) {

        // Set
        Session.set('payment', paymentType);

        // Init Braintree Drop In
        if (paymentType == 'braintree') {

            Meteor.call('getClientToken', function(err, clientToken) {

                if (err) {
                    console.log('There was an error', err);
                    return;
                }

                // Init
                initializeBraintree(clientToken);

            });

        }

        if (paymentType == 'braintreehosted' || paymentType == 'paypalbraintree') {

            if (paymentType == 'braintreehosted') {
                $('#braintree-hosted').show();
            }

            Meteor.call('getClientToken', function(err, clientToken) {

                if (err) {
                    console.log('There was an error', err);
                    return;
                }

                // Init
                initializeBraintreeHosted(clientToken);

            });

        }

    });

    // Get location of visitor
    Meteor.call('getUserLocation', function(err, data) {

        if (err) {
            console.log(err);
            Session.set('useTaxes', false);
            Session.set('currency', 'USD');
            Session.set('countryCode', 'US');

        } else {

            var country_code = data.country_code;
            Session.set('countryCode', country_code);

            Meteor.call('isEuropeanCustomer', country_code, function(err, data) {

                if (data) {
                    Session.set('useTaxes', true);
                    Session.set('currency', 'EUR');

                    Meteor.call('getVAT', country_code, function(err, data) {

                        Session.set('tax', data);

                    });

                } else {
                    Session.set('useTaxes', false);
                    Session.set('currency', 'USD');
                }

            });

        }

    });

}

Template.checkoutPayment.helpers({

    isSimpleTheme: function() {

        if (Metas.findOne({ type: 'checkoutTheme' })) {

            if (Metas.findOne({ type: 'checkoutTheme' }).value == 'simple') {
                return true;
            } else {
                return false;
            }

        } else {
            return true;
        }

    },
    braintreePayment: function() {

        if (Session.get('payment') == 'braintree' || Session.get('payment') == 'braintreehosted') {
            return true;
        } else {
            return false;
        }

    },
    paypalBraintree: function() {

        if (Metas.findOne({ type: 'payment' })) {

            if (Metas.findOne({ type: 'payment' }).value == 'paypalbraintree') {
                return true;
            }

        }

    },
    braintreeHosted: function() {

        if (Session.get('payment') == 'braintreehosted' || Session.get('payment') == 'paypalbraintree') {
            return true;
        } else {
            return false;
        }

    },
    paypalPayment: function() {

        if (Session.get('payment') == 'paypal') {
            return true;
        } else {
            return false;
        }

    },
    paymentFormStatusClass: function() {
        return Session.get('paymentFormStatus') ? 'payment-form__is-submitting' : '';
    },

    useTaxes: function() {
        return Session.get('useTaxes');
    },
    subtotal: function() {

        var cart = Session.get('cart');
        var basePrice = 0;

        // Calculate base price
        if (Session.get('useTaxes') == false) {
            for (i = 0; i < cart.length; i++) {
                basePrice = basePrice + cart[i].price[Session.get('currency')];
            }
        } else {

            for (i = 0; i < cart.length; i++) {
                basePrice = basePrice + cart[i].price[Session.get('currency')] / (1 + Session.get('tax') / 100);
            }

        }

        // Apply discount
        if (Session.get('usingDiscount')) {
            basePrice = basePrice * (1 - Session.get('usingDiscount').amount / 100);
        }

        return basePrice.toFixed(2);
    },
    useTaxes: function() {
        return Session.get('useTaxes');
    },

    taxes: function() {

        // Get cart
        var cart = Session.get('cart');
        var tax = 0;

        // Calculate total
        for (i = 0; i < cart.length; i++) {
            tax = tax + cart[i].price[Session.get('currency')] - (cart[i].price[Session.get('currency')] / (1 + Session.get('tax') / 100)).toFixed(2);
        }

        // Apply discount
        if (Session.get('usingDiscount')) {
            tax = tax * (1 - Session.get('usingDiscount').amount / 100);
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
            total = total * (1 - Session.get('usingDiscount').amount / 100);
        }

        return total.toFixed(2);
    },
    dataIssue: function() {
        return Session.get('dataIssue');
    },
    startCurrency: function() {
        if (Session.get('currency') == 'USD') {
            return '$';
        } else {
            return '';
        }
    },
    endCurrency: function() {
        if (Session.get('currency') == 'EUR') {
            return '€';
        } else {
            return '';
        }
    },
    paymentStatus: function() {
        return Session.get('paymentStatus');
    },
    products: function() {
        return Session.get('cart');
    }

});

Template.checkoutPayment.events({

    'click #paypal-option': function() {

        Session.set('payment', 'paypal');
        $('#braintree-hosted').hide();

    },
    'click #card-option': function() {

        Session.set('payment', 'braintreehosted');
        $('#braintree-hosted').show();

    },
    'click #apply-discount': function(event) {

        // Prevent submit
        event.preventDefault();

        Meteor.call('validateDiscount', $('#discount-code').val(), function(err, data) {

            if (data.valid == true) {
                Session.setTemp('usingDiscount', data);
                $('#discount-message').text('');
            } else {
                Session.setTemp('usingDiscount', false);
                if (Session.get('language') == 'fr') {
                    $('#discount-message').text('Code promo invalide');
                } else {
                    $('#discount-message').text('Invalid discount code');
                }

            }

        });

    },
    'click #purchase': function() {
        Session.set('paymentStatus', true);
    },
    'click #purchase-paypal': function() {

        $('form').submit(false);

        // Send to server
        saleData = createSalesData('paypal');

        if (saleData.email != "" && saleData.lastName != "" && saleData.firstName != "") {

            Session.set('dataIssue', false);
            Session.set('paymentStatus', true);

            console.log(saleData);

            if (Session.get('cart')[0].type == 'validation') {
                Meteor.call('validateProduct', saleData, function(err, data) {
                    window.location = '/thank-you';
                });
            } else {
                Meteor.call('paypalCheckout', saleData, function(err, redirectUrl) {
                    window.location = redirectUrl;
                });
            }

        }
    }

});

function initializeBraintree(clientToken) {
    if (isBraintreeInitialized) return;

    braintree.setup(clientToken, 'dropin', {
        container: 'dropin',
        onPaymentMethodReceived: function(response) {
            Session.set('paymentFormStatus', true);

            $(window).scrollTop(0);

            // Create sale data
            saleData = createSalesData('braintree');
            saleData.nonce = response.nonce;

            saleData.currency = Session.get('currency');

            if (saleData.email != "" && saleData.lastName != "" && saleData.firstName != "") {

                Session.set('dataIssue', false);

                if (Session.get('cart')[0].type == 'validation') {
                    Meteor.call('validateProduct', saleData, function(err, data) {
                        window.location = '/thank-you';
                    });
                } else {
                    Meteor.call('purchaseProduct', saleData, function(err, sale) {
                        Session.set('paymentFormStatus', null);
                        if (sale.success == true) {
                            Router.go("/purchase_confirmation?sale_id=" + sale._id);
                        }
                        if (sale.success == false) {
                            Router.go("/failed_payment?sale_id=" + sale._id);
                        }

                    });
                }

            }
        }
    });

    isBraintreeInitialized = true;
}

function initializeBraintreeHosted(clientToken) {
    if (isBraintreeInitialized) return;

    braintree.setup(clientToken, 'custom', {
        id: 'braintree-form',
        hostedFields: {
            number: {
                selector: "#card-number",
                placeholder: "4111 1111 1111 1111"
            },
            expirationDate: {
                selector: "#expiration-date",
                placeholder: "08/19"
            },
            styles: {
                // Style all elements
                'input': {
                    'font-size': '18px'
                }
            }
        },
        onPaymentMethodReceived: function(response) {

            // Payment status
            Session.set('paymentFormStatus', true);

            // Create sale data
            saleData = createSalesData('braintree');
            saleData.nonce = response.nonce;

            if (saleData.email != "" && saleData.lastName != "" && saleData.firstName != "") {

                Session.set('dataIssue', false);

                if (Session.get('cart')[0].type == 'validation') {
                    Meteor.call('validateProduct', saleData, function(err, data) {
                        window.location = '/thank-you';
                    });
                } else {
                    Meteor.call('purchaseProduct', saleData, function(err, sale) {
                        Session.set('paymentFormStatus', null);
                        if (sale.success == true) {
                            Router.go("/purchase_confirmation?sale_id=" + sale._id);
                        }
                        if (sale.success == false) {
                            Router.go("/failed_payment?sale_id=" + sale._id);
                        }

                    });
                }

            }
        }
    });

    isBraintreeInitialized = true;
}

function createSalesData(paymentProcessor) {

    // Send to server
    var saleData = {
        firstName: $('#first-name').val(),
        lastName: $('#last-name').val(),
        email: $('#email').val()
    }

    saleData.method = paymentProcessor;

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
    if ($('#tax').text() == "") {
        saleData.tax = 0;
        saleData.subtotal = parseFloat($('#total-price').text()).toFixed(2);
    } else {
        saleData.subtotal = parseFloat($('#subtotal').text()).toFixed(2);
        saleData.tax = parseFloat($('#tax').text()).toFixed(2);
    }
    saleData.amount = parseFloat($('#total-price').text()).toFixed(2);
    saleData.currency = Session.get('currency');
    saleData.country = Session.get('countryCode');

    // Register products
    var cart = Session.get('cart');
    var products = [];
    var variants = [];
    for (i = 0; i < cart.length; i++) {
        products.push(cart[i]._id);

        if (cart[i].variantId) {
            variants.push(cart[i].variantId);
        }
        else {
            variants.push(null);
        }
        
    }
    saleData.products = products;
    saleData.variants = variants;

    if (Session.get('usingDiscount')) {
        saleData.discount = Session.get('usingDiscount').amount / 100;
    }

    // Affiliate code ?
    if (Session.get('affiliateCode')) {
        saleData.affiliateCode = Session.get('affiliateCode');
    }
    if (Session.get('origin')) {
        saleData.origin = Session.get('origin');
    }

    return saleData;

}
