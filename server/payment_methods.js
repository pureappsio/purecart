import Images from '../imports/api/files';

// Braintree
Future = Npm.require('fibers/future');
import braintree from 'braintree';

Meteor.methods({

    getBraintreePlan(planId, userId) {

        // Get plans
        var plans = Meteor.call('getBraintreePlans', userId);

        // Find plan
        var plan = {};
        for (i in plans) {
            if (plans[i].id == planId) {
                plan = plans[i];
            }
        }

        return plan;

    },
    getBraintreePlans: function(userId) {

        // Braintree gateway
        var braintreeGateway = Gateways.findOne({ type: 'braintree', userId: userId });

        if (braintreeGateway.mode == 'sandbox') {
            var gateway = braintree.connect({
                environment: braintree.Environment.Sandbox,
                publicKey: braintreeGateway.publicKey,
                privateKey: braintreeGateway.privateKey,
                merchantId: braintreeGateway.merchantId
            });
        }
        if (braintreeGateway.mode == 'production') {
            var gateway = braintree.connect({
                environment: braintree.Environment.Production,
                publicKey: braintreeGateway.publicKey,
                privateKey: braintreeGateway.privateKey,
                merchantId: braintreeGateway.merchantId
            });
        }

        var fut = new Future();

        gateway.plan.all(function(err, plans) {
            fut.return(plans);
        });

        var plans = fut.wait();
        console.log(plans.plans);
        return plans.plans;

    },
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

        // Init paypal
        const paypal = require('paypal-rest-sdk');
        var gateway = Gateways.findOne({ type: 'paypal', userId: sale.userId });
        paypal.configure({
            'mode': gateway.mode,
            'client_id': gateway.client_id,
            'client_secret': gateway.client_secret
        });

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
    getClientToken: function(userId) {

        // Braintree gateway
        var braintreeGateway = Gateways.findOne({ type: 'braintree', userId: userId });
        console.log(braintreeGateway);

        if (braintreeGateway.mode == 'sandbox') {
            var gateway = braintree.connect({
                environment: braintree.Environment.Sandbox,
                publicKey: braintreeGateway.publicKey,
                privateKey: braintreeGateway.privateKey,
                merchantId: braintreeGateway.merchantId
            });
        }
        if (braintreeGateway.mode == 'production') {
            var gateway = braintree.connect({
                environment: braintree.Environment.Production,
                publicKey: braintreeGateway.publicKey,
                privateKey: braintreeGateway.privateKey,
                merchantId: braintreeGateway.merchantId
            });
        }

        // Generate
        var generateToken = Meteor.wrapAsync(gateway.clientToken.generate, gateway.clientToken);
        var options = {};

        // if (clientId) {
        //     options.clientId = clientId;
        // }

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

                    // Init paypal
                    const paypal = require('paypal-rest-sdk');
                    var gateway = Gateways.findOne({ type: 'paypal', userId: sale.userId });
                    paypal.configure({
                        'mode': gateway.mode,
                        'client_id': gateway.client_id,
                        'client_secret': gateway.client_secret
                    });

                    paypal.payment.execute(sale.paymentId, execute_payment_json, function(error, payment) {
                        if (error) {
                            console.log(error.response);
                            fut.return({ state: 'error' });
                        } else {

                            fut.return(payment);
                        }
                    });

                    var payment = fut.wait();
                    // console.log("Payment Response: ");
                    // console.log(JSON.stringify(payment));

                    if (payment.state == 'approved') {

                        // Update sale
                        Sales.update(saleId, {
                            $set: {
                                success: true,
                                firstName: payment.payer.payer_info.first_name,
                                lastName: payment.payer.payer_info.last_name,
                                email: payment.payer.payer_info.email,
                            }
                        });

                        sale = Sales.findOne(saleId);

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
        var brandName = Meteor.call('getBrandName', saleData.userId);

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

        // Init paypal
        const paypal = require('paypal-rest-sdk');
        var gateway = Gateways.findOne({ type: 'paypal', userId: saleData.userId });
        paypal.configure({
            'mode': gateway.mode,
            'client_id': gateway.client_id,
            'client_secret': gateway.client_secret
        });

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

        // Configure braintree
        var braintreeGateway = Gateways.findOne({ type: 'braintree', userId: saleData.userId });
        if (braintreeGateway.mode == 'sandbox') {
            gateway = braintree.connect({
                environment: braintree.Environment.Sandbox,
                publicKey: braintreeGateway.publicKey,
                privateKey: braintreeGateway.privateKey,
                merchantId: braintreeGateway.merchantId
            });
        }
        if (braintreeGateway.mode == 'production') {
            gateway = braintree.connect({
                environment: braintree.Environment.Production,
                publicKey: braintreeGateway.publicKey,
                privateKey: braintreeGateway.privateKey,
                merchantId: braintreeGateway.merchantId
            });
        }

        if (saleData.paymentPlanId) {

            console.log('Creating subscription');

            // Create customer
            var fut = new Future();

            gateway.customer.create({
                firstName: saleData.firstName,
                lastName: saleData.lastName,
                email: saleData.email,
                paymentMethodNonce: saleData.nonce
            }, function(err, result) {

                if (err) { console.log('Customer creation error'); console.log(err); } else {

                    console.log('Customer: ');
                    console.log(result);

                    parameters = {
                        paymentMethodToken: result.customer.paymentMethods[0].token,
                        planId: saleData.paymentPlanId
                    }

                    // Get merchant ID
                    // if (braintreeGateway.merchantIds[saleData.currency]) {
                    //     console.log('Making subscription in native currency');
                    //     parameters.merchantId = braintreeGateway.merchantIds[saleData.currency];
                    // }

                    // Create subscription
                    gateway.subscription.create(parameters, function(err, result) {

                        if (err) { console.log('Subscription error'); console.log(err); }
                        fut.return(result);
                    });

                }
            });

            var answer = fut.wait();
            console.log(answer);

        } else {

            if (saleData.type == "PayPalAccount") {

                console.log('Making transaction');

                // Get merchant ID
                if (braintreeGateway.merchantIds[saleData.currency]) {
                    console.log('Making transaction in native currency');
                    merchantId = braintreeGateway.merchantIds[saleData.currency];
                }

                // Make transaction
                gateway.transaction.sale({
                    amount: saleData.amount,
                    paymentMethodNonce: saleData.nonce,
                    merchantAccountId: merchantId,
                    orderId: saleData.invoiceId,
                    options: {
                        submitForSettlement: true
                    }
                }, function(err, result) {
                    if (err) { console.log(err); }
                    console.log(result);
                    fut.return(result);
                });

                var answer = fut.wait();

            } else {

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
                        if (braintreeGateway.merchantIds[saleData.currency]) {
                            console.log('Making transaction in native currency');
                            merchantId = braintreeGateway.merchantIds[saleData.currency];
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

            }

        }

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
        Meteor.call('getSaleOrigin', sale);

        // Send notification
        Meteor.call('sendNotification', sale);

        // Send tripwire
        Meteor.call('sendTripwire', sale);

        // Send feedback
        Meteor.call('sendFeedback', sale);

        // Enroll customer
        Meteor.call('enrollCustomer', sale);

        // Add to plan
        Meteor.call('addCustomerPlan', sale);

        // Add to list
        Meteor.call('addToList', sale);

        // Add redirect
        Meteor.call('addRedirect', sale);

    },

    afterFailActions: function(sale) {

        console.log('After failed sale actions ...');

        // Failed notification
        Meteor.call('sendFailedNotification', sale);

        // Recovery email
        Meteor.call('sendRecoverEmail', sale);
    }


});
