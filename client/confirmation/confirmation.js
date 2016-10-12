Template.confirmation.rendered = function() {

}

Template.confirmation.helpers({

  mainPicture: function() {
    return Session.get('mainPicture');
  },
  productName: function() {
    var product = Products.findOne(this.productId);
    return product.name;
  },
  productUrl: function() {
    var product = Products.findOne(this.productId);
    return product.url;
  }

});