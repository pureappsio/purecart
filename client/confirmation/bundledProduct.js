Template.bundledProduct.helpers({

	productName: function() {

      var product = Products.findOne(this.productId);
      return product.name;
	},
	productUrl: function() {
	  var product = Products.findOne(this.productId);
	  return product.url;
	}

});
