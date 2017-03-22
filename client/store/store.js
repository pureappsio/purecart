Template.store.rendered = function() {

    // Find Store front
    if (Metas.findOne({ type: 'useStoreFront', userId: Session.get('sellerId') })) {
        if (Metas.findOne({ type: 'useStoreFront', userId: Session.get('sellerId') }).value == 'yes') {

            // Add background image
            var pictureId = Metas.findOne({ type: 'storeFrontPicture', userId: Session.get('sellerId') }).value;
            $('.heading-row').css('background-image', 'url(' + Images.findOne(pictureId).link() + ')');
        }
    }

    Session.set('storeExitIntent', false);

};

Template.store.events({

    'mousemove, mouseleave': function(event) {

        // Show exit intent
        showExitIntent(event, 'storefront', 'offer');

    }

});


Template.store.helpers({

    useStoreFront: function() {

        if (Metas.findOne({ type: 'useStoreFront', userId: Session.get('sellerId') })) {
            if (Metas.findOne({ type: 'useStoreFront', userId: Session.get('sellerId') }).value == 'yes') {
                return true;
            }
        }

    },

    emailContact: function() {
        return 'mailto:' + Metas.findOne({ type: 'brandEmail', userId: Session.get('sellerId') }).value;
    },
    storeName: function() {
        return Metas.findOne({ type: 'brandName', userId: Session.get('sellerId') }).value;
    },
    mainPicture: function() {
        return Session.get('mainPicture');
    },
    products: function() {

        var products = Products.find({ show: true, userId: Session.get('sellerId') }, { sort: { _id: -1 } }).fetch();

        var storeProductsRow = [];
        groupIndex = 0;

        if (Metas.findOne({ type: 'articlesLine', userId: Session.get('sellerId') })) {
            productsLine = Metas.findOne({ type: 'articlesLine', userId: Session.get('sellerId') }).value;
        } else {
            productsLine = 3;
        }

        for (i = 0; i < products.length; i + productsLine) {

            storeProductsRow[groupIndex] = products.splice(i, i + productsLine);
            groupIndex++;

        }

        console.log(storeProductsRow);

        return storeProductsRow;
    }

});
