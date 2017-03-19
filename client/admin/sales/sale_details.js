Template.saleDetails.helpers({

    saleProducts: function() {

        console.log(this);

        var saleProducts = [];

        for (i in this.products) {
            saleProducts.push(Products.findOne(this.products[i]));
        }

        return saleProducts;

    }

});
