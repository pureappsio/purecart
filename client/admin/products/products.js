Template.products.onRendered(function() {

});

Template.products.events({

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
        if (selection == 'download') {

            $('#product-option').append("<input id='product-url' type='text' class='form-control' placeholder='URL ...''>")

        }

    },
    'click #add-product': function() {

        // Get info
        product = {
            name: $('#product-name').val(),
            price: {
                EUR: parseFloat($('#product-price-eur').val()),
                USD: parseFloat($('#product-price-usd').val())
            },
            userId: Meteor.user()._id
        };

        // Show in store by default
        product.show = true;

        // Type
        var type = $('#product-type :selected').val();
        product.type = type;

        if (type == 'api') {
            product.courses = $('#product-courses :selected').val();
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
        return Products.find({ userId: Meteor.user()._id }, { sort: { name: 1 } });
    }

});
