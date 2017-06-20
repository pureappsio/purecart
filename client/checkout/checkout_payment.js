// Braintree
Session.set('paymentFormStatus', null);
Session.set('purchaseInProgress', false);

var isBraintreeInitialized = false;
var braintree = require('braintree-web');
var braintreeDrop = require('braintree-web-drop-in');

Template.checkoutPayment.rendered = function() {

    console.log(Session.get('affiliateCode'));

    // Reset status of payment
    Session.set('paymentStatus', false);

    // Reset status of plan
    Session.set('planDetails', null);

    // Check payment type
    Meteor.call('getPayment', Session.get('sellerId'), function(err, paymentType) {

        // Set
        Session.set('payment', paymentType);

        // Stripe
        if (paymentType == 'stripe') {

            console.log('Stripe init');

            Meteor.call('getStripeData', Session.get('sellerId'), function(err, data) {

                // Stripe
                var stripe = Stripe(data.publishable_key);

                // Create an instance of Elements
                var elements = stripe.elements();

                var style = {
                    base: {
                        color: '#32325d',
                        lineHeight: '24px',
                        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                        fontSmoothing: 'antialiased',
                        fontSize: '16px',
                        '::placeholder': {
                            color: '#aab7c4'
                        }
                    },
                    invalid: {
                        color: '#fa755a',
                        iconColor: '#fa755a'
                    }
                };

                // Create an instance of the card Element
                var card = elements.create('card', { style: style });

                // Add an instance of the card Element into the `card-element` <div>
                card.mount('#card-element');

                // Handle real-time validation errors from the card Element.
                card.addEventListener('change', function(event) {
                    var displayError = document.getElementById('card-errors');
                    if (event.error) {
                        displayError.textContent = event.error.message;
                    } else {
                        displayError.textContent = '';
                    }
                });

                // Handle form submission
                var form = document.getElementById('braintree-form');
                form.addEventListener('submit', function(event) {
                    event.preventDefault();

                    stripe.createToken(card).then(function(result) {

                        if (result.error) {

                            // Inform the user if there was an error
                            var errorElement = document.getElementById('card-errors');
                            errorElement.textContent = result.error.message;

                        } else {

                            // Sale data
                            var saleData = createSalesData('stripe');

                            // Token
                            saleData.token = result.token;

                            // Send the token to your server
                            Meteor.call('stripeCheckout', saleData, function(err, sale) {

                                Session.set('paymentFormStatus', null);
                                if (sale.success == true) {
                                    Router.go("/purchase_confirmation?sale_id=" + sale._id);
                                }
                                if (sale.success == false) {
                                    Router.go("/failed_payment?sale_id=" + sale._id);
                                }

                            });
                        }
                    });
                });


            });

        }

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

        if (products[i].paymentPlan) {

            // Load plan data
            Meteor.call('getBraintreePlan', products[i].paymentPlan, Session.get('sellerId'), function(err, data) {

                Session.set('planDetails', data);

            });

        }

        session = {
            date: new Date(),
            productId: products[i]._id,
            type: 'checkout',
            country: Session.get('countryCode'),
            userId: Session.get('sellerId')
        };

        // Origin & medium
        if (Session.get('origin')) {
            session.origin = Session.get('origin');
        } else {
            session.origin = 'organic';
        }
        if (Session.get('medium')) {
            session.medium = Session.get('medium');
        }

        // Mobile or Desktop
        if (/Mobi/.test(navigator.userAgent)) {
            session.browser = 'mobile';
        } else {
            session.browser = 'desktop';
        }

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
    braintreeUi: function() {

        if (Metas.findOne({ type: 'payment', userId: Session.get('sellerId') })) {

            if (Metas.findOne({ type: 'payment', userId: Session.get('sellerId') }).value == 'braintree') {
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
    stripePayment: function() {

        if (Session.get('payment') == 'stripe') {
            return true;
        } else {
            return false;
        }

    },
    cardPayment: function() {

        if (Session.get('payment') == 'stripe' || Session.get('payment') == 'braintree' || Session.get('payment') == 'braintreehosted') {
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

        // Get cart
        var cart = Session.get('cart');
        var tax = 0;
        var total = 0;

        if (Session.get('planDetails')) {

            total = computePrice(getPlanPrice(Session.get('planDetails')));

        } else {
            // Calculate total
            for (i = 0; i < cart.length; i++) {

                var price = computePrice(cart[i].price);

                if (typeof cart[i].qty !== 'undefined') {
                    total = total + price * cart[i].qty;
                } else {
                    total = total + price;
                }

            }
        }

        // Apply discount
        total = applyDiscount(total);

        // Tax
        tax = parseFloat(total * Session.get('tax') / 100);
        total = parseFloat(total);

        // Base price
        var basePrice = parseFloat(total.toFixed(2)) - parseFloat(tax.toFixed(2));

        return parseFloat(basePrice).toFixed(2);
    },
    useTaxes: function() {
        return Session.get('useTaxes');
    },
    monthly: function() {

        if (Session.get('planDetails')) {
            return '/mo.';
        }

    },
    taxes: function() {

        // Get cart
        var cart = Session.get('cart');
        var tax = 0;
        var total = 0;

        if (Session.get('planDetails')) {

            total = computePrice(getPlanPrice(Session.get('planDetails')));

        } else {
            // Calculate total
            for (i = 0; i < cart.length; i++) {

                var price = computePrice(cart[i].price);

                if (typeof cart[i].qty !== 'undefined') {
                    total = total + price * cart[i].qty;
                } else {
                    total = total + price;
                }

            }
        }

        // Apply discount
        total = applyDiscount(total);

        // Tax
        tax = total * Session.get('tax') / 100;
        return parseFloat(tax).toFixed(2);

    },
    total: function() {

        // Get cart
        var cart = Session.get('cart');
        var total = 0;

        // Calculate total
        if (Session.get('planDetails')) {

            total = computePrice(getPlanPrice(Session.get('planDetails')));

        } else {
            for (i = 0; i < cart.length; i++) {

                var price = computePrice(cart[i].price);

                if (typeof cart[i].qty !== 'undefined') {
                    total = total + price * cart[i].qty;
                } else {
                    total = total + price;
                }

            }
        }

        // Apply discount
        total = applyDiscount(total);

        return parseFloat(total).toFixed(2)

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

    'keydown #email': function() {

        $('#email-group').removeClass('has-danger');
        $('#email').removeClass('form-control-danger');

    },
    'keydown #first-name': function() {

        $('#first-name-group').removeClass('has-danger');
        $('#first-name').removeClass('form-control-danger');

    },
    'keydown #last-name': function() {

        $('#last-name-group').removeClass('has-danger');
        $('#last-name').removeClass('form-control-danger');

    },
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
        // Session.set('paymentStatus', true);
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

    var button = document.querySelector('#purchase');

    Meteor.call('getCartTitle', Session.get('sellerId'), function(err, title) {

        // Dropin
        var dropinParameters = {
            authorization: clientToken,
            selector: '#dropin'
        }

        // Paypal (not with recurring)
        if (!Session.get('planDetails')) {
            dropinParameters.paypal = {
                flow: 'checkout',
                amount: parseFloat($('#total-price').text()),
                currency: Session.get('currency'),
                locale: 'en_US',
                displayName: title
            }
        }

        braintreeDrop.create(dropinParameters, function(createErr, instance) {

            Session.set('paymentFormStatus', true);
            $(window).scrollTop(0);

            button.addEventListener('click', function(event) {

                // Prevent
                event.preventDefault();

                // if (Session.get('purchaseInProgress') == false && $('#first-name').val() != "" && $('#last-name').val() != "" && $('#email').val() != "") {

                if (Session.get('purchaseInProgress') == false) {

                    // Disable button
                    $('#purchase').addClass('disabled');
                    Session.set('purchaseInProgress', true);

                    // Create sale data
                    saleData = createSalesData('braintree');
                    saleData.currency = Session.get('currency');

                    console.log('Init payment ...');

                    if (saleData.email != "" && saleData.lastName != "" && saleData.firstName != "") {

                        console.log('Validated inputs ');
                        Session.set('paymentStatus', true);

                        instance.requestPaymentMethod(function(requestPaymentMethodErr, payload) {

                            if (requestPaymentMethodErr) {

                                // Enable button
                                $('#purchase').removeClass('disabled');
                                Session.set('purchaseInProgress', false);
                                Session.set('paymentStatus', false);

                            } else {

                                // Get nonce & type
                                saleData.nonce = payload.nonce;
                                saleData.type = payload.type;

                                console.log('Got nonce');

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
                    } else {

                        // Disable current purchase
                        $('#purchase').removeClass('disabled');
                        Session.set('purchaseInProgress', false);

                        console.log($('#first-name').val());

                        if ($('#first-name').val() == "") {
                            $('#first-name-group').addClass('has-danger');
                            $('#first-name').addClass('form-control-danger');
                        }

                        if ($('#email').val() == "") {
                            $('#email-group').addClass('has-danger');
                            $('#email').addClass('form-control-danger');
                        }

                        if ($('#last-name').val() == "") {
                            $('#last-name-group').addClass('has-danger');
                            $('#last-name').addClass('form-control-danger');
                        }

                    }

                }

            });

        });

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

                // Prevent
                event.preventDefault();

                // Check if all fields are ok & no current payment in progress
                if (Session.get('purchaseInProgress') == false && $('#first-name').val() != "" && $('#last-name').val() != "" && $('#email').val() != "") {

                    // No data issue & set disabled button
                    Session.set('dataIssue', false);
                    $('#purchase').addClass('disabled');
                    Session.set('purchaseInProgress', true);

                    hostedFieldsInstance.tokenize(function(tokenizeErr, payload) {

                        if (tokenizeErr) {
                            console.error(tokenizeErr);
                            return;
                        }

                        // Payment status
                        Session.set('paymentFormStatus', true);

                        // Create sale data
                        saleData = createSalesData('braintree');
                        saleData.nonce = payload.nonce;
                        saleData.type = 'CreditCard';

                        if (saleData.email != "" && saleData.lastName != "" && saleData.firstName != "") {

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

                }

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

    if (paymentProcessor != 'braintree') {

        if (saleData.email == "" || saleData.lastName == "" || saleData.firstName == "") {

            Session.set('dataIssue', true);

        }
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
    if (Session.get('medium')) {
        saleData.medium = Session.get('medium');
    }
    if (Session.get('planDetails')) {
        saleData.paymentPlanId = Session.get('planDetails').id;
    }

    return saleData;

}
