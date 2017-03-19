Template.admin.onRendered(function() {

    // Default view
    if (!Session.get('view')) {
        Session.set('view', 'brand');
    }

    $('#datetimepicker').datetimepicker();

    Tracker.autorun(function() {

        // Init picker
        $('#bundle-products').selectpicker();

        // Fill picker
        Meteor.call('getProducts', function(err, products) {

            for (i = 0; i < products.length; i++) {
                $('#bundle-products').append($('<option>', {
                    value: products[i]._id,
                    text: products[i].name
                }));
            }

            // Refresh picker
            $('#bundle-products').selectpicker('refresh');

        });

        // Init lists
        Meteor.call('getEmailLists', function(err, lists) {

            $('#email-lists').empty();

            for (i = 0; i < lists.length; i++) {
                $('#email-lists').append($('<option>', {
                    value: lists[i]._id,
                    text: lists[i].name
                }));
            }

        });

    });



});

Template.admin.events({

    'keyup #store-street': function() {

        Meteor.call('insertMeta', {
            type: 'storeStreet',
            value: $('#store-street').val()
        });

    },
    'keyup #store-zip': function() {

        Meteor.call('insertMeta', {
            type: 'storeZip',
            value: $('#store-zip').val()
        });

    },
    'keyup #store-country': function() {

        Meteor.call('insertMeta', {
            type: 'storeCountry',
            value: $('#store-country').val()
        });

    },
    'keyup #store-city': function() {

        Meteor.call('insertMeta', {
            type: 'storeCity',
            value: $('#store-city').val()
        });

    },
    'click #save-checkout-theme': function() {

        var meta = {
            type: 'checkoutTheme',
            value: $('#checkout-theme :selected').val()
        };

        Meteor.call('insertMeta', meta);

    },
    'click #save-home-page': function() {

         var meta = {
            type: 'homePage',
            value: $('#home-page :selected').val()
        };

        Meteor.call('insertMeta', meta);

    },
    'click #save-articles-line': function() {
         var meta = {
            type: 'articlesLine',
            value: parseInt($('#articles-line :selected').val())
        };

        Meteor.call('insertMeta', meta);
    },
    'click #export-sales': function() {

        // Get data
        // var startDate = new Date($('#export-start-date').val());
        // var endDate = new Date($('#export-end-date').val());

        var option = $('#export-option :selected').val();
        var currency = $('#export-currency :selected').val();

        // Change URL
        if (currency == 'sales') {
            Router.go("/export_sales?option=" + option);
        } else {
            Router.go("/export_sales?option=" + option + '&currency=' + currency);
        }

    },
    'click #product-type, change #product-type': function() {

        // Get selection
        var selection = $('#product-type :selected').val();
        $('#product-option').empty();

        if (selection == 'api') {

            Meteor.call('getCourses', function(err, data) {

                // Select
                $('#product-option').append("<select id='product-courses' class='form-control'></select>")

                // Init picker
                $('#product-courses').selectpicker();

                // Integrations
                for (i = 0; i < data.length; i++) {
                    $('#product-courses').append($('<option>', {
                        value: data[i]._id,
                        text: data[i].name
                    }));
                }

                // Refresh picker
                $('#product-courses').selectpicker('refresh');

            });

        }
        if (selection == 'download') {

            $('#product-option').append("<input id='product-url' type='text' class='form-control' placeholder='URL ...''>")

        }

    },
    'click #add-integration': function() {

        var accountData = {
            type: $('#integration-type :selected').val(),
            key: $('#integration-key').val(),
            url: $('#integration-url').val(),
            userId: Meteor.user()._id
        };
        Meteor.call('addIntegration', accountData);

    },

    'click #set-list': function() {

        // Set list
        Meteor.call('setList', $('#email-lists :selected').val());

    },

    'click .section-selector': function(event) {

        Session.set('view', event.target.id);

    },
    'click #generate-short': function() {

        // Set list
        Meteor.call('generateShortNames');

    },

    'click #set-payment': function() {

        // Set list
        Meteor.call('setPayment', $('#payment-type :selected').val());

    },
    'click #generate-key': function() {

        Meteor.call('generateApiKey');

    },

    'click #authorize': function() {

        Meteor.call('authorizePaypalOrder', $('#sale-id').val(), $('#order-id').val());

    },

    'click #get-vat': function() {

        // Get dates
        var startDate = new Date($('#start-date').val());
        var endDate = new Date($('#end-date').val());

        // Get VAT
        var sales = Sales.find({ date: { $lte: endDate, $gte: startDate } }).fetch();
        var vat = 0;
        for (i = 0; i < sales.length; i++) {
            vat = vat + sales[i].tax;
        }
        $('#vat').text(vat);

    },
    'click #add-product': function() {

        // Get info
        product = {
            name: $('#product-name').val(),
            price: {
                EUR: parseFloat($('#product-price-eur').val()),
                USD: parseFloat($('#product-price-usd').val())
            }
        };

        // Show in store by default
        product.show = true;

        // Type
        var type = $('#product-type :selected').val();
        product.type = type;

        if (type == 'api') {
            product.courses = $('#product-courses').val();
        }
        if (type == 'download') {
            product.url = $('#product-url').val();
        }

        // Add
        Meteor.call('addProduct', product);

    },
    'click #add-bundle': function() {

        // Get info
        product = {
            name: $('#bundle-name').val(),
            price: {
                EUR: parseFloat($('#bundle-price-eur').val()),
                USD: parseFloat($('#bundle-price-usd').val())
            },
            bundledProducts: $('#bundle-products').val()
        };

        // Show in store by default
        product.show = true;

        // Add
        Meteor.call('addProduct', product);

    },
    'click #set-title': function() {

        // Add
        Meteor.call('setTitle', Session.get('titlePicture'));

    },
    'click #set-language': function() {

        // Add
        Meteor.call('setLanguage', $('#language').val());

    },
    'click #set-brand-data': function() {

        // Add
        Meteor.call('insertMeta', { type: 'brandName', value: $('#brand-name').val() });
        Meteor.call('insertMeta', { type: 'brandEmail', value: $('#brand-email').val() });
        // Meteor.call('setBrandData', $('#brand-name').val(), $('#brand-email').val());

    },
    'click #set-pixel': function() {

        // Add
        Meteor.call('insertMeta', { type: 'pixel', value: $('#facebook-pixel').val() });

    },
    'click #set-tracking': function() {

        // Add
        Meteor.call('insertMeta', { type: 'tracking', value: $('#google-tracking').val() });

    },
    'click #create-discount': function() {

        // Discount
        var discount = {
            name: $('#discount-name').val(),
            code: $('#discount-code').val(),
            amount: $('#discount-amount').val(),
            type: $('#discount-type :selected').val()
        }

        // Expiry date?
        if ($('#discount-expiry-date').val() != "") {
            discount.expiryDate = new Date($('#discount-expiry-date').val());
        }

        // Add
        Meteor.call('createDiscount', discount);

    }

});

Template.admin.helpers({

    showSection: function(section) {
        if (Session.get('view') == section) {
            return true;
        }
    },
    integrations: function() {
        return Integrations.find({});
    },
    key: function() {
        return Meteor.user().apiKey;
    },
    discounts: function() {
        return Discounts.find({});
    },
    products: function() {
        return Products.find({}, { sort: { name: 1 } });
    },
    sales: function() {
        return Sales.find({}, { sort: { date: -1 } });
    }

});
