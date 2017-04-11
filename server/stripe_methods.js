Future = Npm.require('fibers/future');

Meteor.methods({

	getStripeData: function(sellerId) {

		var gateway = Gateways.findOne({ type: 'stripe', userId: sellerId });
		return gateway;

	},
    stripeCheckout: function(saleData) {

        console.log('Sales data ...');
        console.log(saleData);

        // Make transaction
        var fut = new Future();

        // Configure stripe
        var gateway = Gateways.findOne({ type: 'stripe', userId: saleData.userId });
        var stripe = require("stripe")(gateway.secret_key);

        // Generate description
        var productName = Products.findOne(saleData.products[0]).name;

        // Get price in cents
        var amount = parseFloat(saleData.amount) * 100;

        // Charge
        var charge = stripe.charges.create({
            amount: amount,
            currency: saleData.currency,
            description: productName,
            source: saleData.token.id,
        }, function(err, charge) {

            if (err) {
                console.log(err);
            }

            fut.return(charge);

        });

        var answer = fut.wait();
        console.log(answer);

        if (answer.status == 'succeeded') {

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

    }

});
