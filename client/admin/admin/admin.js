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

    'click #update-app': function() {

        Meteor.call('updateApp');

    },
    'click #logout': function() {

        Meteor.logout(function() {

            Router.go('/login');

        });

    },

    'click #save-checkout-theme': function() {

        var meta = {
            type: 'checkoutTheme',
            value: $('#checkout-theme :selected').val(),
            userId: Meteor.user()._id
        };

        Meteor.call('insertMeta', meta);

    },
    'click #save-home-page': function() {

        var meta = {
            type: 'homePage',
            value: $('#home-page :selected').val(),
            userId: Meteor.user()._id
        };

        Meteor.call('insertMeta', meta);

    },
    'click #save-articles-line': function() {


        Meteor.call('insertMeta', {
            type: 'articlesLine',
            value: parseInt($('#articles-line :selected').val()),
            userId: Meteor.user()._id
        });
    },
    'click #export-sales': function() {

        var option = $('#export-option :selected').val();
        var currency = $('#export-currency :selected').val();
        var userId = Meteor.user()._id;

        // Change URL
        if (currency == 'sales') {
            Router.go("/export_sales?option=" + option + '&user=' + userId);
        } else {
            Router.go("/export_sales?option=" + option + '&currency=' + currency + '&user=' + userId);
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
    'click #create-discount': function() {

        // Discount
        var discount = {
            name: $('#discount-name').val(),
            code: $('#discount-code').val(),
            amount: $('#discount-amount').val(),
            type: $('#discount-type :selected').val(),
            userId: Meteor.user()._id
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

    storeLink: function() {

        if (Meteor.user().role == 'admin') {
            return Meteor.absoluteUrl();
        } else {
            var hostnameArray = document.location.hostname.split(".");
            if (hostnameArray.length == 2) {
                return 'http://' + Meteor.user().domain + '.' + hostnameArray[0] + '.' + hostnameArray[1];

            } else if (hostnameArray.length == 3) {
                return 'http://' + Meteor.user().domain + '.' + hostnameArray[1] + '.' + hostnameArray[2];
            }
        }

    },
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
        return Discounts.find({ userId: Meteor.user()._id });
    },

    sales: function() {
        return Sales.find({ userId: Meteor.user()._id }, { sort: { date: -1 } });
    },
    users: function() {
        return Meteor.users.find();
    }

});
