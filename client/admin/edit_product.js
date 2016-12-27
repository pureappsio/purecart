Template.editProduct.onRendered(function() {

    // Init
    $('#summernote').summernote({ height: 350 });

    if (this.data.description) {
        $('#summernote').summernote('code', this.data.description);
    }

    // Set session to false
    Session.set('thumb', false);
    Session.set('mainMedia', false);

    // Get selection
    var selection = this.data.type;
    $('#product-option').empty();

    // Get current product
    var currentProduct = this.data;

    // Delivery option
    if (selection == 'api') {

        Meteor.call('getIntegrations', function(err, data) {

            // Select
            $('#product-option').append("<select id='product-integration' class='form-control'></select>")

            // Integrations
            for (i = 0; i < data.length; i++) {
                $('#product-integration').append($('<option>', {
                    value: data[i]._id,
                    text: data[i].url
                }));
            }

        });

    }
    if (selection == 'download') {

        // Put URL option
        $('#product-option').append("<input id='product-url' type='text' class='form-control' placeholder='URL ...''>")

        // Fill if URL already exist
        if (currentProduct.url) {
            $('#product-url').val(currentProduct.url);
        }

    }

});

Template.editProduct.helpers({

    singleDownload: function() {

        if (this.bundledProducts) {
            return false;
        } else {
            return true;
        }

    },
    image: function() {
        if (this.imageId) {
            return true;
        } else {
            return false;
        }
    },
    imageLink: function(imageId) {
        return Images.findOne(imageId).link();
    },
    elements: function() {
        return Elements.find({productId: this._id})
    }

});

Template.editProduct.events({


    'click #add-media': function() {

        if (Session.get('additionalMedia')) {

            // Create media
            var media = {
                type: 'additionalPicture',
                imageId: Session.get('additionalMedia'),
                productId: this._id
            }

            // Insert
            Meteor.call('insertElement', media);
        }



    },
    'click #edit-product': function() {

        // Get info
        product = {
            name: $('#product-name').val(),
            shortName: $('#short-name').val(),
            price: {
                EUR: parseFloat($('#product-price-eur').val()),
                USD: parseFloat($('#product-price-usd').val())
            },
            _id: this._id
        };

        // Bundled
        if (this.bundledProducts) {

            // Show by default
            product.show = true;

            // Set same bundle
            product.bundledProducts = this.bundledProducts;

        } else {

            // Type
            var type = $('#product-type :selected').val();
            product.type = type;

            if (type == 'api') {
                product.integrationId = $('#product-integration :selected').val();
            }
            if (type == 'download') {
                product.url = $('#product-url').val();
            }

        }

        // Picture of product
        if (this.imageId) {
            product.imageId = this.imageId;
        }

        if (this.mainMedia) {
            product.mainMedia = this.mainMedia;
        }

        if (Session.get('thumb')) {
            product.imageId = Session.get('thumb');
        }

        if (Session.get('mainMedia')) {
            product.mainMedia = Session.get('mainMedia');
        }

        // Show or hide from store
        if ($('#hide-store :selected').val() == 'show') {
            product.show = true;
        }
        if ($('#hide-store :selected').val() == 'hide') {
            product.show = false;
        }

        // Description
        product.description = $('#summernote').summernote('code');

        // Add
        Meteor.call('editProduct', product)

    },
    'click #product-type, change #product-type': function() {

        // Get selection
        var selection = $('#product-type :selected').val();
        $('#product-option').empty();

        // Get current product
        var currentProduct = this;

        if (selection == 'api') {

            Meteor.call('getIntegrations', function(err, data) {

                // Select
                $('#product-option').append("<select id='product-integration' class='form-control'></select>")

                // Integrations
                for (i = 0; i < data.length; i++) {
                    $('#product-integration').append($('<option>', {
                        value: data[i]._id,
                        text: data[i].url
                    }));
                }

            });

        }
        if (selection == 'download') {

            // Put URL option
            $('#product-option').append("<input id='product-url' type='text' class='form-control' placeholder='URL ...''>")

            // Fill if URL already exist
            if (currentProduct.url) {
                $('#product-url').val(currentProduct.url);
            }

        }

    }

});
