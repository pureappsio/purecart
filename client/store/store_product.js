Template.storeProduct.helpers({

    discount: function() {

        if (Session.get('usingDiscount')) {
            return true;
        }

    },
    imageLink: function() {

        if (Elements.findOne({ storePicture: true, productId: this._id, type: 'productPictures' })) {

            var pictureId = Elements.findOne({ storePicture: true, productId: this._id, type: 'productPictures' }).imageId;
            return Images.findOne(pictureId).link();

        } else if (Elements.findOne({ order: 1, productId: this._id, type: 'productPictures' })) {
            var pictureId = Elements.findOne({ order: 1, productId: this._id, type: 'productPictures' }).imageId;
            return Images.findOne(pictureId).link();
        }

        if (this.imageId) {
            return Images.findOne(this.imageId).link();
        }
    },
    productsLine: function() {
        if (Metas.findOne({ type: 'articlesLine' })) {
            if (Metas.findOne({ type: 'articlesLine' }).value == 4) {
                return 3;
            } else {
                return 4;
            }
        } else {
            return 4;
        }
    },
    soldOut: function() {

        if (this.type == 'physical') {
            if (this.qty == 0) {
                return 'sold-out';
            }
        }
    },
    soldOutPicture: function() {
        if (this.type == 'physical') {
            if (this.qty == 0) {
                return 'sold-out-picture';
            }
        }
    },
    soldOutMessage: function() {

        if (this.type == 'physical') {
            if (this.qty == 0) {
                return 'Sold out';
            }
        }
    }
})
