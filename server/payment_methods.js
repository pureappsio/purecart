// Braintree
Future = Npm.require('fibers/future');
import braintree from 'braintree';
import paypal from 'paypal-rest-sdk';

// Use SandBox locally
if (process.env.ROOT_URL == "http://localhost:3000/") {

    // Sandbox
    gateway = braintree.connect({
        environment: braintree.Environment.Sandbox,
        publicKey: Meteor.settings.sandboxPublicKey,
        privateKey: Meteor.settings.sandboxPrivateKey,
        merchantId: Meteor.settings.sandboxMerchantId
    });

    // Merchant IDs
    var merchantIds = {
        EUR: Meteor.settings.sandboxMerchantEUR,
        USD: Meteor.settings.sandboxMerchantUSD
    };

} else {

    // Real
    gateway = braintree.connect({
        environment: braintree.Environment.Production,
        publicKey: Meteor.settings.livePublicKey,
        privateKey: Meteor.settings.livePrivateKey,
        merchantId: Meteor.settings.liveMerchantId
    });

    var merchantIds = {
        EUR: Meteor.settings.liveMerchantEUR,
        USD: Meteor.settings.liveMerchantUSD
    };

}

// Paypal
paypal.configure({
    'mode': Meteor.settings.paypal.mode,
    'client_id': Meteor.settings.paypal.client_id,
    'client_secret': Meteor.settings.paypal.client_secret
});

Meteor.methods({

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

            product = Products.findOne(saleData.products[i]);

            // Price
            if (saleData.discount) {
                price = (parseFloat(product.price[saleData.currency]) * (1 - saleData.discount)).toFixed(2);
            } else {
                price = product.price[saleData.currency];
            }

            var item = {
                "name": product.name,
                "sku": product._id,
                "price": price,
                "currency": saleData.currency,
                "quantity": 1
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

        // Enroll customer
        Meteor.call('enrollCustomer', sale);

        // Add to list
        Meteor.call('addToList', sale);

    },

    afterFailActions: function(sale) {

        // Failed notification
        Meteor.call('sendFailedNotification', sale);

        // Recovery email
        Meteor.call('sendRecoverEmail', sale);
    }
    

});
