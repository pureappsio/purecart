Template.paymentProcessor.onRendered(function() {

    if (Metas.findOne({ type: 'paypalMode', userId: Meteor.user()._id })) {
        var mode = Metas.findOne({ type: 'paypalMode', userId: Meteor.user()._id }).value;
        $('#paypal-mode').val(mode)
    }

    if (Metas.findOne({ type: 'braintreeMode', userId: Meteor.user()._id })) {
        var mode = Metas.findOne({ type: 'braintreeMode', userId: Meteor.user()._id }).value;
        $('#braintree-mode').val(mode)
    }

    if (Metas.findOne({ type: 'payment', userId: Meteor.user()._id })) {
        var type = Metas.findOne({ type: 'payment', userId: Meteor.user()._id }).value;
        $('#payment-type').val(type)
    }

});

Template.paymentProcessor.events({

    'click #set-payment': function() {

        // Set list
        Meteor.call('setPayment', $('#payment-type :selected').val());

    },
    'click #set-paypal': function() {

        // Metas
        Meteor.call('insertMeta', {
            type: 'paypalClientId',
            value: $('#paypal-id').val(),
            userId: Meteor.user()._id
        });

        Meteor.call('insertMeta', {
            type: 'paypalSecret',
            value: $('#paypal-secret').val(),
            userId: Meteor.user()._id
        });

        Meteor.call('insertMeta', {
            type: 'paypalMode',
            value: $('#paypal-mode :selected').val(),
            userId: Meteor.user()._id
        });

        // Gateaway
        Meteor.call('setGateway', {
            userId: Meteor.user()._id,
            type: 'paypal',
            client_id: $('#paypal-id').val(),
            mode: $('#paypal-mode :selected').val(),
            client_secret: $('#paypal-secret').val()
        })

    },
    'click #set-braintree': function() {

        // Metas
        Meteor.call('insertMeta', {
            type: 'braintreePublicKey',
            value: $('#braintree-public').val(),
            userId: Meteor.user()._id
        });

        Meteor.call('insertMeta', {
            type: 'braintreePrivateKey',
            value: $('#braintree-private').val(),
            userId: Meteor.user()._id
        });

        Meteor.call('insertMeta', {
            type: 'braintreeMerchantId',
            value: $('#braintree-merchant').val(),
            userId: Meteor.user()._id
        });

        Meteor.call('insertMeta', {
            type: 'braintreeMode',
            value: $('#braintree-mode :selected').val(),
            userId: Meteor.user()._id
        });

        Meteor.call('insertMeta', {
            type: 'braintreeMerchantEUR',
            value: $('#braintree-eur').val(),
            userId: Meteor.user()._id
        });

        Meteor.call('insertMeta', {
            type: 'braintreeMerchantUSD',
            value: $('#braintree-usd').val(),
            userId: Meteor.user()._id
        });

        Meteor.call('insertMeta', {
            type: 'braintreeMerchantGBP',
            value: $('#braintree-gbp').val(),
            userId: Meteor.user()._id
        });

        // Gateaway
        Meteor.call('setGateway', {
            userId: Meteor.user()._id,
            type: 'braintree',
            mode: $('#braintree-mode :selected').val(),
            publicKey: $('#braintree-public').val(),
            privateKey: $('#braintree-private').val(),
            merchantId: $('#braintree-merchant').val(),
            merchantIds: {
                EUR: $('#braintree-eur').val(),
                USD: $('#braintree-usd').val(),
                GBP: $('#braintree-gbp').val()
            }
        })

    }

});

Template.paymentProcessor.helpers({

});
