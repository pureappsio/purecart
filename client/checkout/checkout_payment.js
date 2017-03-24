Session.set('paymentFormStatus', null);
var isBraintreeInitialized = false;
var braintree = require('braintree-web');

Template.checkoutPayment.rendered = function() {

    console.log(Session.get('affiliateCode'));

    // Reset status of payment
    Session.set('paymentStatus', false);

    // Check payment type
    Meteor.call('getPayment', Session.get('sellerId'), function(err, paymentType) {

        // Set
        Session.set('payment', paymentType);

        // Init Braintree Drop In
        if (paymentType == 'braintree') {

            Meteor.call('getClientToken', Session.get('sellerId'), function(err, clientToken) {

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

            Meteor.call('getClientToken', Session.get('sellerId'), function(err, clientToken) {

                if (err) {
                    console.log('There was an error', err);
                    return;
                }

                // Init
                initializeBraintreeHosted(clientToken);

            });

        }

    });

    // No physical product by default
    Session.set('physicalProduct', false);

    // Count visits
    var products = Session.get('cart');

    for (i = 0; i < products.length; i++) {

        if (products[i].type == 'physical') {
            Session.set('physicalProduct', true);
        }

        session = {
            date: new Date(),
            productId: products[i]._id,
            type: 'checkout',
            country: Session.get('countryCode'),
            userId: Session.get('sellerId')
        };

        Meteor.call('insertSession', session);

    }

}

Template.checkoutPayment.helpers({

    isPhysicalProduct: function() {

        if (Session.get('physicalProduct')) {
            return true;
        } else {
            return false;
        }

    },
    isSimpleTheme: function() {

        if (Metas.findOne({ type: 'checkoutTheme', userId: Session.get('sellerId') })) {

            if (Metas.findOne({
                    type: 'checkoutTheme',
                    userId: Session.get('sellerId')
                }).value == 'simple') {
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

        if (Metas.findOne({ type: 'payment', userId: Session.get('sellerId') })) {

            if (Metas.findOne({ type: 'payment', userId: Session.get('sellerId') }).value == 'paypalbraintree') {
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

                var price = computePrice(cart[i].price);

                if (typeof cart[i].qty !== 'undefined') {
                    basePrice = basePrice + price * cart[i].qty;
                } else {
                    basePrice = basePrice + price;
                }

            }
        } else {

            for (i = 0; i < cart.length; i++) {

                var price = computePrice(cart[i].price);

                if (typeof cart[i].qty !== 'undefined') {
                    basePrice = basePrice + price / (1 + Session.get('tax') / 100) * cart[i].qty;

                } else {
                    basePrice = basePrice + price / (1 + Session.get('tax') / 100);

                }
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

            var price = computePrice(cart[i].price);

            if (typeof cart[i].qty !== 'undefined') {
                tax = tax + price * cart[i].qty - (price / (1 + Session.get('tax') / 100) * cart[i].qty).toFixed(2);
            } else {
                tax = tax + price - (price / (1 + Session.get('tax') / 100)).toFixed(2);

            }
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

            var price = computePrice(cart[i].price);

            if (typeof cart[i].qty !== 'undefined') {
                total = total + price * cart[i].qty;
            } else {
                total = total + price;
            }

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

    var form = document.querySelector('#braintree-form');

    braintree.client.create({
        authorization: clientToken
    }, function(err, clientInstance) {
        if (err) {
            console.error(err);
            return;
        }
        createHostedFields(clientInstance);
    });

    function createHostedFields(clientInstance) {
        braintree.hostedFields.create({
            client: clientInstance,
            styles: {
                'input': {
                    'font-size': '16px',
                    'color': '#3a3a3a'
                },
                ':focus': {
                    'color': 'black'
                }
            },
            fields: {
                number: {
                    selector: '#card-number',
                    placeholder: '4111 1111 1111 1111'
                },
                cvv: {
                    selector: '#cvv',
                    placeholder: '123'
                },
                expirationDate: {
                    selector: '#expiration-date',
                    placeholder: 'MM/YYYY'
                }
            }
        }, function(err, hostedFieldsInstance) {

            hostedFieldsInstance.on('validityChange', function(event) {
                var field = event.fields[event.emittedBy];

                if (field.isValid) {
                    if (event.emittedBy === 'expirationMonth' || event.emittedBy === 'expirationYear') {
                        if (!event.fields.expirationMonth.isValid || !event.fields.expirationYear.isValid) {
                            return;
                        }
                    } else if (event.emittedBy === 'number') {
                        $('#card-number').next('span').text('');
                    }

                    // Apply styling for a valid field
                    $(field.container).parents('.form-group').addClass('has-success');
                    $(field.container).parents('.form-group').addClass('has-feedback');
                } else if (field.isPotentiallyValid) {
                    // Remove styling  from potentially valid fields
                    $(field.container).parents('.form-group').removeClass('has-warning');
                    $(field.container).parents('.form-group').removeClass('has-success');
                    if (event.emittedBy === 'number') {
                        $('#card-number').next('span').text('');
                    }
                } else {
                    // Add styling to invalid fields
                    $(field.container).parents('.form-group').addClass('has-warning');
                    // Add helper text for an invalid card number
                    if (event.emittedBy === 'number') {
                        $('#card-number').next('span').text('Looks like this card number has an error.');
                    }
                }
            });

            form.addEventListener('submit', function(event) {

                event.preventDefault();

                hostedFieldsInstance.tokenize(function(tokenizeErr, payload) {

                    if (tokenizeErr) {
                        console.error(tokenizeErr);
                        return;
                    }

                    // If this was a real integration, this is where you would
                    // send the nonce to your server.
                    // console.log('Got a nonce: ' + payload.nonce);

                    // Payment status
                    Session.set('paymentFormStatus', true);

                    // Create sale data
                    saleData = createSalesData('braintree');
                    saleData.nonce = payload.nonce;

                    // console.log(saleData);

                    if (saleData.email != "" && saleData.lastName != "" && saleData.firstName != "") {

                        Session.set('dataIssue', false);
                        $('#purchase').addClass('disabled');

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


                });

            }, false);

        });

    }

    isBraintreeInitialized = true;
}

function createSalesData(paymentProcessor) {

    // Send to server
    var saleData = {
        userId: Session.get('sellerId')
    }

    if (paymentProcessor != 'paypal') {

        saleData.firstName = $('#first-name').val();
        saleData.lastName = $('#last-name').val();
        saleData.email = $('#email').val();
        
    }

    // Physical product?
    if (Session.get('physicalProduct')) {
        saleData.shipStreet = $('#ship-address').val(),
            saleData.shipZip = $('#ship-zip').val(),
            saleData.shipCity = $('#ship-city').val(),
            saleData.shipCountry = $('#ship-country').val(),
            saleData.shipPhone = $('#phone').val()
    }

    saleData.method = paymentProcessor;

    if (saleData.email == "" || saleData.lastName == "" || saleData.firstName == "") {

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
    var quantities = [];
    for (i = 0; i < cart.length; i++) {
        products.push(cart[i]._id);

        if (cart[i].variantId) {
            variants.push(cart[i].variantId);
        } else {
            variants.push(null);
        }

        if (cart[i].qty) {
            quantities.push(cart[i].qty);
        } else {
            quantities.push(null);
        }

    }
    saleData.products = products;
    saleData.variants = variants;
    saleData.quantities = quantities;

    // Mobile or Desktop
    if (/Mobi/.test(navigator.userAgent)) {
        saleData.browser = 'mobile';
    } else {
        saleData.browser = 'desktop';
    }

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
