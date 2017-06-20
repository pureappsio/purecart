Template.products.onRendered(function() {

});

Template.products.events({

    'change #pricing-type': function() {

        var selection = $('#pricing-type :selected').val();
        $('#product-price').empty();

        if (selection == 'recurring') {

            Meteor.call('getBraintreePlans', Meteor.user()._id, function(err, data) {

                // Select
                $('#product-price').append("<select id='product-payment-plans' class='form-control'></select>")

                // Integrations
                for (i = 0; i < data.length; i++) {
                    $('#product-payment-plans').append($('<option>', {
                        value: data[i].id,
                        text: data[i].name
                    }));
                }

            });

        } else {
            $('#product-price').append('<input id="product-price-usd" type="text" class="form-control" placeholder="Price (USD) ...">');
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

                // // Init picker
                // $('#product-courses').selectpicker();

                // Integrations
                for (i = 0; i < data.length; i++) {
                    $('#product-courses').append($('<option>', {
                        value: data[i]._id,
                        text: data[i].name
                    }));
                }

                // // Refresh picker
                // $('#product-courses').selectpicker('refresh');

            });

        }
        if (selection == 'saas') {

            Meteor.call('getPlans', function(err, data) {

                // Select
                $('#product-option').append("<select id='product-plans' class='form-control'></select>")

                // Integrations
                for (i = 0; i < data.length; i++) {
                    $('#product-plans').append($('<option>', {
                        value: data[i]._id,
                        text: data[i].name
                    }));
                }

            });

        }
        if (selection == 'download') {

            $('#product-option').append("<input id='product-url' type='text' class='form-control' placeholder='URL ...''>")

        }

    },
    'click #add-product': function() {

        // Get info
        product = {
            name: $('#product-name').val(),
            userId: Meteor.user()._id
        };

        // Pricing type
        var selection = $('#pricing-type :selected').val();
        if (selection == 'recurring') {

            product.paymentPlan = $('#product-payment-plans :selected').val();

        } else {

            product.price = {
                EUR: parseFloat($('#product-price-usd').val()),
                USD: parseFloat($('#product-price-usd').val())
            }

        }

        // Show in store by default
        product.show = true;

        // Type
        var type = $('#product-type :selected').val();
        product.type = type;

        if (type == 'api') {
            product.courses = $('#product-courses :selected').val();
        }
        if (type == 'saas') {
            product.plan = $('#product-plans :selected').val();
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
            bundledProducts: $('#bundle-products').val(),
            userId: Meteor.user()._id
        };

        // Show in store by default
        product.show = true;

        // Add
        Meteor.call('addProduct', product);

    }

});

Template.products.helpers({

    allProducts: function() {

        // Get products
        var products = Products.find({ userId: Meteor.user()._id }, { sort: { name: 1 } }).fetch();

        // Add sales
        for (i in products) {

            // Get all sales
            var productSales = Sales.find({
                products: {
                    $elemMatch: { $eq: products[i]._id }
                }
            }).fetch().length;

            products[i].sales = productSales;

        }

        // Sort
        products.sort(function(a, b) {
            return parseFloat(b.sales) - parseFloat(a.sales);
        });

        return products;
    }

});
