// Braintree
Future = Npm.require('fibers/future');
import braintree from 'braintree';
import paypal from 'paypal-rest-sdk';

if (Meteor.settings.braintree.mode == 'sandbox') {

    // Sandbox
    gateway = braintree.connect({
        environment: braintree.Environment.Sandbox,
        publicKey: Meteor.settings.braintree.publicKey,
        privateKey: Meteor.settings.braintree.privateKey,
        merchantId: Meteor.settings.braintree.merchantId
    });

}

if (Meteor.settings.braintree.mode == 'production') {

    // Real
    gateway = braintree.connect({
        environment: braintree.Environment.Production,
        publicKey: Meteor.settings.braintree.publicKey,
        privateKey: Meteor.settings.braintree.privateKey,
        merchantId: Meteor.settings.braintree.merchantId
    });

}

// Merchant IDs
var merchantIds = {
    EUR: Meteor.settings.braintree.merchantEUR,
    USD: Meteor.settings.braintree.merchantUSD,
    GBP: Meteor.settings.braintree.merchantGBP
};

// Paypal
paypal.configure({
    'mode': Meteor.settings.paypal.mode,
    'client_id': Meteor.settings.paypal.client_id,
    'client_secret': Meteor.settings.paypal.client_secret
});

Meteor.methods({


    computePrice(price, currency) {

        if (price[currency]) {
            return price[currency];
        } else {
            var rates = Metas.findOne({ type: 'rates' }).value;
            var finalPrice = price.EUR * rates[currency];
            return parseFloat(finalPrice.toFixed(0) + '.99');
        }

    },

    authorizePaypalOrder: function(saleId, orderId) {

        var sale = Sales.findOne(saleId);

        var authorize_details = {
            "amount": {
                "currency": sale.currency,
                "total": sale.amount
            }
        };

        var capture_details = {
            "amount": {
                "currency": sale.currency,
                "total": sale.amount
            },
            "is_final_capture": true
        };

        paypal.order.authorize(orderId, authorize_details, function(error, authorization) {
            if (error) {
                console.log(error.response);
            } else {
                //console.log(authorization);

                paypal.order.capture(orderId, capture_details, function(error, capture) {
                    if (error) {
                        console.error(error);
                    } else {
                        //console.log(capture);
                    }
                });

            }
        });

    },
    getClientToken: function(clientId) {
        var generateToken = Meteor.wrapAsync(gateway.clientToken.generate, gateway.clientToken);
        var options = {};

        if (clientId) {
            options.clientId = clientId;
        }

        var response = generateToken(options);

        return response.clientToken;
    },
    confirmSale: function(saleId, payerId) {

        // Get sale    
        var sale = Sales.findOne(saleId);

        if (sale.success == false) {

            // Confirm
            console.log('Confirming sale ...')
            console.log(sale);

            if (payerId != "") {

                if (sale.method == 'paypal') {

                    // Execute payment
                    var execute_payment_json = {
                        "payer_id": payerId,
                        "transactions": [{
                            "amount": {
                                "currency": sale.currency,
                                "total": sale.amount
                            }
                        }]
                    };

                    var fut = new Future();
                    paypal.payment.execute(sale.paymentId, execute_payment_json, function(error, payment) {
                        if (error) {
                            console.log(error.response);
                            fut.return({ state: 'error' });
                        } else {
                            console.log("Get Payment Response");
                            fut.return(payment);
                        }
                    });

                    var payment = fut.wait();
                    //console.log(JSON.stringify(payment));

                    if (payment.state == 'approved') {

                        // Update sale
                        Sales.update(saleId, { $set: { success: true } });

                        // After sale actions
                        Meteor.call('afterSaleActions', sale);

                        return true;

                    } else {

                        return false;
                    }

                }

            }

        }
        if (sale.success == true) {
            return true;
        }

    },
    paypalCheckout(saleData) {

        saleData.date = new Date();
        saleData.invoiceId = Sales.find({}).fetch().length + 1;
        saleData.success = false;

        console.log('Sales data ...');
        console.log(saleData);

        // Insert sale
        saleId = Sales.insert(saleData)

        // Get items
        var items = [];
        for (i = 0; i < saleData.products.length; i++) {

            // Get product
            product = Products.findOne(saleData.products[i]);

            // Variant ?
            if (saleData.variants[i] != null) {
                variant = Variants.findOne(saleData.variants[i]);
                product.price = variant.price;
                product.name += ' (' + variant.name + ')';
            }

            // Quantity?
            if (saleData.quantities[i] != null) {
                quantity = saleData.quantities[i];
            } else {
                quantity = 1;
            }

            // Price
            var convertedPrice = Meteor.call('computePrice', product.price, saleData.currency);
            if (saleData.discount) {
                price = (convertedPrice * (1 - saleData.discount)).toFixed(2);
            } else {
                price = convertedPrice;
            }

            var item = {
                "name": product.name,
                "sku": product._id,
                "price": price,
                "currency": saleData.currency,
                "quantity": quantity
            };
            items.push(item);

        }
        console.log('Items: ');
        console.log(items);

        // Get brand name
        var brandName = Meteor.call('getBrandName');

        var create_payment_json = {
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": Meteor.absoluteUrl() + "validate_payment?sale_id=" + saleId,
                "cancel_url": Meteor.absoluteUrl() + "failed_payment?sale_id=" + saleId
            },
            "transactions": [{
                "item_list": {
                    "items": items
                },
                "amount": {
                    "currency": saleData.currency,
                    "total": saleData.amount
                },
                "description": "Order on " + brandName
            }]

        };

        // Make payment
        var fut = new Future();
        paypal.payment.create(create_payment_json, function(error, payment) {
            if (error) {
                console.log(error);
            } else {
                console.log("Create Payment Response");
                // console.log(payment);
                fut.return(payment);
            }
        });

        // Return
        var payment = fut.wait();
        console.log(payment);

        // Update sale
        Sales.update(saleId, { $set: { paymentId: payment.id } });

        // Find redirect link
        for (var i = 0; i < payment.links.length; i++) {
            var link = payment.links[i];
            if (link.method == 'REDIRECT') {
                var redirectLink = link.href;
            }
        }

        return redirectLink;


    },
    purchaseProduct(saleData) {

        console.log('Sales data ...');
        console.log(saleData);

        // Make transaction
        var fut = new Future();

        // Verify card
        console.log('Verify card');
        gateway.customer.create({
            firstName: saleData.firstName,
            lastName: saleData.lastName,
            creditCard: {
                paymentMethodNonce: saleData.nonce,
                options: {
                    verifyCard: true
                }
            }
        }, function(err, result) {

            console.log(result);

            if (result.success == false) {

                // Card declined
                console.log('Card declined');
                fut.return(result);

            }
            if (result.success == true) {

                console.log('Making transaction');

                // Get merchant ID
                if (merchantIds[saleData.currency]) {
                    console.log('Making transaction in native currency');
                    merchantId = merchantIds[saleData.currency];
                    chargedAmount = saleData.amount;
                }

                // Make transaction
                gateway.transaction.sale({
                    amount: chargedAmount,
                    merchantAccountId: merchantId,
                    paymentMethodToken: result.customer.paymentMethods[0].token,
                    options: {
                        submitForSettlement: true
                    }
                }, function(err, result) {
                    if (err) { console.log(err); }
                    console.log(result);
                    fut.return(result);
                });

            }

        });

        var answer = fut.wait();

        if (answer.success == true) {

            saleData.success = true;
            saleData.date = new Date();
            saleData.invoiceId = Sales.find({}).fetch().length + 1;

            // Insert sale
            saleId = Sales.insert(saleData)
            sale = Sales.findOne(saleId);

            // After sale actions
            Meteor.call('afterSaleActions', sale);

        } else {

            // Put sale as failed
            saleData.success = false;
            saleData.date = new Date();
            saleData.invoiceId = Sales.find({}).fetch().length + 1;

            // Insert sale
            saleId = Sales.insert(saleData)
            sale = Sales.findOne(saleId);

        }

        return sale;

    },
    afterSaleActions: function(sale) {

        // Send email to customer
        Meteor.call('sendReceipt', sale);

        // Get customer origin
        Meteor.call('getOrigin', sale);

        // Send notification
        Meteor.call('sendNotification', sale);

        // Send tripwire
        Meteor.call('sendTripwire', sale);

        // Send feedback
        Meteor.call('sendFeedback', sale);

        // Enroll customer
        Meteor.call('enrollCustomer', sale);

        // Add to list
        Meteor.call('addToList', sale);

    },

    afterFailActions: function(sale) {

        console.log('After failed sale actions ...');

        // Failed notification
        Meteor.call('sendFailedNotification', sale);

        // Recovery email
        Meteor.call('sendRecoverEmail', sale);
    }


});
