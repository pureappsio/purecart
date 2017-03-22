Template.editProduct.onRendered(function() {

    // Init
    CKEDITOR.replace('summernote');
    CKEDITOR.replace('tripwire-text');
    CKEDITOR.replace('feedback-text');

    $('.note-popover').css({ display: 'none' });

    // Set session to false
    Session.set('productMedia', false);

    if (this.data) {
        if (this.data.description) {
            $('#summernote').val(this.data.description);
        }

        if (this.data.tripwireText) {
            $('#tripwire-text').val(this.data.tripwireText);
        }

        if (this.data.tripwireType) {
            $('#use-tripwire').val(this.data.tripwireType);
        }

        if (this.data.feedbackText) {
            $('#feedback-text').val(this.data.feedbackText);
        }

        if (this.data.useFeedback) {
            $('#use-feedback').val(this.data.useFeedback);
        }

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

    isPhysicalProduct: function() {

        if (this.type == 'physical') {

            return true;

        }

    },
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
    mediaElements: function() {
        return Elements.find({ type: 'productPictures', productId: this._id })
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
            productId: this._id,
            userId: Meteor.user()._id

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

        if (Session.get('productMedia')) {

            // Create media
            var media = {
                type: 'productPictures',
                imageId: Session.get('productMedia'),
                productId: this._id,
                userId: Meteor.user()._id
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
            productId: this._id,
            userId: Meteor.user()._id
        };

        // Type
        var type = $('#variant-type :selected').val();
        variant.type = type;

        if (type == 'api') {
            variant.courses = $('#variant-courses :selected').val();
            if ($('#variant-modules').val() != null) {
                variant.modules = $('#variant-modules').val();

            }
            if ($('#variant-bonuses').val() != null) {
                variant.bonuses = $('#variant-bonuses').val();

            }
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
            _id: this._id,
            userId: Meteor.user()._id
        };

        // Base price
        if ($('#base-price-usd').val() != "") {
            product.basePrice = {};
            product.basePrice.USD = parseFloat($('#base-price-usd').val());
            product.basePrice.EUR = parseFloat($('#base-price-eur').val());
        }

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

            if (type == 'physical') {
                product.dimensions = {
                    length: parseInt($('#product-length').val()),
                    width: parseInt($('#product-width').val()),
                    height: parseInt($('#product-height').val()),
                    weight: parseInt($('#product-weight').val())
                }
                product.sku = $('#product-sku').val();
                product.cost = parseFloat($('#product-cost').val());
            }

        }

        // Linked to shipwire?
        if (this.shipwireId) {
            product.shipwireId = this.shipwireId;
        }

        // Show or hide from store
        if ($('#hide-store :selected').val() == 'show') {
            product.show = true;
        }
        if ($('#hide-store :selected').val() == 'hide') {
            product.show = false;
        }

        // Description
        product.description = CKEDITOR.instances['summernote'].getData();

        // Sales description
        product.salesDescriptionTitle = $('#sales-description-title').val();

        // Tripwire
        if ($('#use-tripwire :selected').val() == 'no') {
            product.useTripwire = false;
        } else {
            product.useTripwire = true;
            product.tripwireType = $('#use-tripwire :selected').val();
            product.tripwireText = CKEDITOR.instances['tripwire-text'].getData();
            product.tripwireSubject = $('#tripwire-subject').val();
        }

        // Feedback
        if ($('#use-feedback :selected').val() == 'no') {
            product.useFeedback = $('#use-feedback :selected').val();
        } else {
            product.useFeedback = $('#use-feedback :selected').val();
            product.feedbackText = CKEDITOR.instances['feedback-text'].getData();
            product.feedbackSubject = $('#feedback-subject').val();
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
    'click #variant-courses, change #variant-courses': function() {

        var selectedCourse = $('#variant-courses :selected').val();
        console.log(selectedCourse);

        Meteor.call('getModules', selectedCourse, function(err, data) {

            // Init picker
            $('#variant-modules').empty();
            $('#variant-modules').selectpicker();

            // Integrations
            for (i = 0; i < data.length; i++) {
                $('#variant-modules').append($('<option>', {
                    value: data[i]._id,
                    text: data[i].name
                }));
            }

            // Refresh picker
            $('#variant-modules').selectpicker('refresh');

        });

        Meteor.call('getBonuses', selectedCourse, function(err, data) {

            // Init picker
            $('#variant-bonuses').empty();
            $('#variant-bonuses').selectpicker();

            // Integrations
            for (i = 0; i < data.length; i++) {
                $('#variant-bonuses').append($('<option>', {
                    value: data[i]._id,
                    text: data[i].name
                }));
            }

            // Refresh picker
            $('#variant-bonuses').selectpicker('refresh');

        });

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
