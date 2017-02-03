Template.editProduct.onRendered(function() {

    // Init
    $('#summernote').summernote({ height: 350 });
    $('#tripwire-text').summernote({ height: 200 });

    if (this.data) {
        if (this.data.description) {
            $('#summernote').summernote('code', this.data.description);
        }

        if (this.data.tripwireText) {
            $('#tripwire-text').summernote('code', this.data.tripwireText);
        }

        if (this.data.tripwireType) {
            $('#use-tripwire').val(this.data.tripwireType);
        }
    }

    // Set session to false
    Session.set('thumb', false);
    Session.set('mainMedia', false);

    // Get selection
    if (this.data) {
        var selection = this.data.type;

        $('#product-type').val(this.data.type);

        $('#product-option').empty();

        // Get current product
        var currentProduct = this.data;

        // Delivery option
        if (selection == 'api') {

            courses = this.data.courses;

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
                $('#product-courses').val(courses);
                $('#product-courses').selectpicker('refresh');

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

Template.editProduct.helpers({

    variants: function() {
        return Variants.find({ productId: this._id });
    },
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
    mediaElements: function() {
        return Elements.find({ type: 'additionalPicture', productId: this._id })
    },
    salesElements: function() {
        return Elements.find({ type: 'salesElement', productId: this._id })
    }

});

Template.editProduct.events({

    'click #add-element': function() {

        var element = {

            type: 'salesElement',
            value: $('#sales-element-name').val(),
            productId: this._id

        }

        Meteor.call('insertElement', element);

    },

    'change #use-tripwire, click #use-tripwire': function() {

        // Get value
        var choice = $('#use-tripwire :selected').val();
        console.log(choice);

        // Set session
        if (choice == 'email') {
            $('#tripwire-text').show();
        } else {
            $('#tripwire-text').hide();
        }

    },

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
    'click #add-variant': function() {

        // Get info
        variant = {
            name: $('#variant-name').val(),
            price: {
                EUR: parseFloat($('#variant-price-eur').val()),
                USD: parseFloat($('#variant-price-usd').val())
            },
            productId: this._id
        };

        // Type
        var type = $('#variant-type :selected').val();
        variant.type = type;

        if (type == 'api') {
            variant.courses = $('#variant-courses :selected').val();
        }
        if (type == 'download') {
            variant.url = $('#variant-url').val();
        }

        // Insert
        Meteor.call('insertVariant', variant);

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
                product.courses = $('#product-courses :selected').val();
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

        // Sales description
        product.salesDescriptionTitle = $('#sales-description-title').val();

        // Tripwire
        if ($('#use-tripwire :selected').val() == 'no') {
            product.useTripwire = false;
        } else {
            product.useTripwire = true;
            product.tripwireType = $('#use-tripwire :selected').val();
            product.tripwireText = $('#tripwire-text').summernote('code');
            product.tripwireSubject = $('#tripwire-subject').val();
        }

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

            // Put URL option
            $('#product-option').append("<input id='product-url' type='text' class='form-control' placeholder='URL ...''>")

            // Fill if URL already exist
            if (currentProduct.url) {
                $('#product-url').val(currentProduct.url);
            }

        }

    },
    'click #variant-type, change #variant-type': function() {

        // Get selection
        var selection = $('#variant-type :selected').val();
        $('#variant-option').empty();

        if (selection == 'api') {

            Meteor.call('getCourses', function(err, data) {

                // Select
                $('#variant-option').append("<select id='variant-courses' class='form-control'></select>")

                // Init picker
                $('#variant-courses').selectpicker();

                // Integrations
                for (i = 0; i < data.length; i++) {
                    $('#variant-courses').append($('<option>', {
                        value: data[i]._id,
                        text: data[i].name
                    }));
                }

                // Refresh picker
                $('#variant-courses').selectpicker('refresh');

            });


        }
        if (selection == 'download') {

            // Put URL option
            $('#variant-option').append("<input id='variant-url' type='text' class='form-control' placeholder='URL ...''>")


        }

    }

});
