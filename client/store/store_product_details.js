Template.storeProductDetails.onRendered(function() {

    if (Session.get('storefrontExitIntent') != 'fired') {
        Session.set('storefrontExitIntent', 'armed');
    }

    // Exit intent
    if (!Session.get('usingDiscount')) {

        if (/Mobi/.test(navigator.userAgent)) {

            Session.set('scrollTrigger', false);

            // Check scroll 
            $(window).unbind('scroll');
            $(window).scroll(function() {
                var percent = $(window).scrollTop() / $(document).height() * 2 * 100;
                showMobileExitIntent(percent, 'storefront', 'offer');
            });

        }
    }

    // Reset selection
    if (this.data) {

        // Session
        var session = getSessionData({
            type: 'visit',
            productId: this.data._id
        });

        Meteor.call('insertSession', session);

        productId = this.data._id;
        Session.set('selectedPicture_' + this.data._id, null);

        // Media
        var element = Elements.find({ productId: this.data._id, type: 'productPictures' }, { sort: { order: 1 } }).fetch()[0];
        var media = Images.findOne(element.imageId);

        // Video
        if (videojs.getPlayers()['product-video-' + this.data._id]) {
            delete videojs.getPlayers()['product-video-' + this.data._id];
        }

        // Picture ?
        if (media.ext == 'mp4') {
            $('#product-image-' + productId).hide();
        } else {
            $('#product-image-' + productId).show();
        }

        // Init video
        videojs("product-video-" + this.data._id, {}, function() {

            var player = this;
            if (media.ext == 'mp4') {
                $('#product-video-' + productId).show();
                videojs.getPlayers()['product-video-' + productId].src({ type: "video/mp4", src: media.link() });
            } else {
                $('#product-video-' + productId).hide();
            }
            player.load();

        });

    }


});

Template.storeProductDetails.helpers({

    discount: function() {

        if (Session.get('usingDiscount')) {

            var discount = Session.get('usingDiscount');

            // Check if product restricted
            if (discount.productId) {

                if (discount.productId == this._id) {
                    return true;
                }

            } else {
                if (Session.get('usingDiscount').type == 'percent') {
                    return true;
                }
            }
        }

    },

    isFull: function(star) {

        if (star.type == 'full') {
            return true;
        }

    },
    isHalf: function(star) {

        if (star.type == 'half') {
            return true;
        }

    },
    isEmpty: function(star) {

        if (star.type == 'empty') {
            return true;
        }

    },
    reviewsEnabled: function() {
        if (Metas.findOne({ type: 'reviewsEnable', userId: Session.get('sellerId') })) {

            var value = Metas.findOne({ type: 'reviewsEnable', userId: Session.get('sellerId') }).value;

            if (value == 'disable') {
                return false;
            } else {
                return true;
            }

        } else {
            return true;
        }
    },
    averageRating: function() {

        var reviews = Reviews.find({ productId: this._id }).fetch();

        var averageRating = 0;
        for (r in reviews) {
            averageRating += reviews[r].rating;
        }
        averageRating = averageRating / reviews.length;

        var stars = [];

        // Full
        var fullStars = Math.trunc(averageRating);
        for (i = 0; i < fullStars; i++) {
            stars.push({ type: 'full' });
        }

        // Half
        var halfStars = averageRating - fullStars;
        if (halfStars != 0) {
            halfStars = Math.ceil(halfStars);
            for (j = 0; j < halfStars; j++) {
                stars.push({ type: 'half' });
            }
        }

        // Empty
        var emptyStars = 5 - fullStars - halfStars;
        if (emptyStars != 0) {
            for (k = 0; k < emptyStars; k++) {
                stars.push({ type: 'empty' });
            }
        }

        return stars;

    },

    severalReviews: function() {

        var reviews = Reviews.find({ productId: this._id }).fetch().length;

        if (reviews >= 2) {
            return true;
        }

    },
    areReviews: function() {

        var reviews = Reviews.find({ productId: this._id }).fetch().length;

        if (reviews > 0) {
            return true;
        }

    },
    nbReviews: function() {
        return Reviews.find({ productId: this._id }).fetch().length;
    },
    reviews: function() {

        return Reviews.find({ productId: this._id });

    },
    mainImageLink: function() {

        if (Session.get('selectedPicture_' + this._id)) {
            console.log('Link: ' + Images.findOne(Session.get('selectedPicture_' + this._id)).link());
            return Images.findOne(Session.get('selectedPicture_' + this._id)).link();
        } else if (Elements.findOne({ productId: this._id, type: 'productPictures' })) {
            var pictureId = Elements.find({ productId: this._id, type: 'productPictures' }, { sort: { order: 1 } }).fetch()[0].imageId;
            return Images.findOne(pictureId).link();
        }
    },
    imageLink: function(imageId) {
        return Images.findOne(imageId).link();
    },
    soldOut: function() {

        if (this.type == 'physical') {
            if (this.qty == 0) {
                return true;
            }
        }

    },
    isVideo: function() {

        if (Session.get('selectedPicture_' + this._id)) {

            var media = Images.findOne(Session.get('selectedPicture_' + this._id));

            if (media.ext == 'mp4') {
                return true;
            } else {
                return false;
            }

        } else if (Elements.findOne({ order: 1, productId: this._id, type: 'productPictures' })) {
            var pictureId = Elements.findOne({ order: 1, productId: this._id, type: 'productPictures' }).imageId;
            var media = Images.findOne(pictureId);

            if (media.ext == 'mp4') {
                return true;
            } else {
                return false;
            }
        }
    },
    // mainPicture: function() {
    //     return Session.get('mainPicture');
    // },
    areAdditionalImages: function() {
        if (Elements.findOne({ productId: this._id, type: 'productPictures' })) {
            return true;
        } else {
            return false;
        }
    },
    addImages: function() {
        return Elements.find({ productId: this._id, type: 'productPictures' }, { sort: { order: 1 } });
    }
});

Template.storeProductDetails.onRendered(function() {

    // // Get image
    // Meteor.call('getTitle', function(err, url) {
    //     Session.set('mainPicture', url);
    // });    

    if (Session.get('storefrontExitIntent') != 'fired') {
        Session.set('storefrontExitIntent', 'armed');
    }

});


Template.storeProductDetails.events({

    'mousemove, mouseleave': function(event) {

        // Show exit intent
        if (!Session.get('usingDiscount')) {
            showExitIntent(event, 'storefront', 'offer');
        }


    },

    'click #add-cart': function() {

        // Add product to cart
        if (Session.get('cart')) {

            var products = Session.get('cart');

            // Check if product is already in cart
            var alreadyInCart = false;
            for (i = 0; i < products.length; i++) {
                if (products[i]._id == this._id) {

                    // If physical product, increase quantity
                    if (products[i].type == 'physical') {
                        products[i].qty += 1;
                    }

                    alreadyInCart = true;
                    break;
                }
            }

            if (alreadyInCart == false) {
                if (this.qty) {
                    this.qty += 1;
                } else {
                    this.qty = 1;
                }
                products.push(this);
            }

            Session.set('cart', products);

        } else {

            if (this.qty) {
                this.qty += 1;
            } else {
                this.qty = 1;
            }
            Session.set('cart', [this]);
        }

        // Set window location to cart
        Router.go("/cart");

    }

});
