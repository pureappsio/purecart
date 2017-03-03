Template.store.rendered = function() {

    // Get image
    Meteor.call('getTitle', function(err, url) {
        Session.set('mainPicture', url);
    });

    if (Metas.findOne({ type: 'useStoreFront' })) {
        if (Metas.findOne({ type: 'useStoreFront' }).value == 'yes') {

            // Add background image
            var pictureId = Metas.findOne({ type: 'storeFrontPicture' }).value;
            $('.heading-row').css('background-image', 'url(' + Images.findOne(pictureId).link() + ')');
        }
    }

};

Template.store.helpers({

    useStoreFront: function() {

        if (Metas.findOne({ type: 'useStoreFront' })) {
            if (Metas.findOne({ type: 'useStoreFront' }).value == 'yes') {
                return true;
            }
        }

    },

    storeName: function() {
        return Metas.findOne({ type: 'brandName' }).value;
    },
    mainPicture: function() {
        return Session.get('mainPicture');
    },
    products: function() {

        var products = Products.find({ show: true }, { sort: { _id: -1 } }).fetch();

        var storeProductsRow = [];
        groupIndex = 0;

        if (Metas.findOne({ type: 'articlesLine' })) {
            productsLine = Metas.findOne({ type: 'articlesLine' }).value;
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
