Template.confirmation.rendered = function() {

  // Get image
  Meteor.call('getTitle', function(err, url) {
    Session.set('mainPicture', url);
  });

}

Template.confirmation.helpers({

  bundledProducts: function() {
    var product = Products.findOne(this.products[0]);
    var answer = [];
    if (product.bundledProducts) {
      for (i = 0; i < product.bundledProducts.length; i++) {
        answer.push({productId: product.bundledProducts[i]});
      }
    }
    return answer;
  },
  isDownload: function() {
    var product = Products.findOne(this.products[0]);
    if (product.url || product.bundledProducts) {
      return true;
    }
    else {
      return false;
    }
  },
  isSuccess: function() {
    console.log(this);
    if (this.success == true) {
      return true;
    }
    else {
      return false;
    }
  },
  isApi: function() {
    var product = Products.findOne(this.products[0]);
    if (product.integrationId) {
      return true;
    }
    else {
      return false;
    }
  },
  isService: function() {
    var product = Products.findOne(this.products[0]);
    if (product.type == 'service') {
      return true;
    }
    else {
      return false;
    }
  },
  isSingleDownload: function() {
    var product = Products.findOne(this.products[0]);
    if (product.url || product.url == "") {
      return true;
    }
    else {
      return false;
    }
  },
  downloads: function() {

    return Products.find({'_id': { $in: this.products}});

  },
  mainPicture: function() {
    return Session.get('mainPicture');
  },
  productName: function() {
    var product = Products.findOne(this.products[0]);
    return product.name;
  },
  productUrl: function() {
    var product = Products.findOne(this.products[0]);
    return product.url;
  }

});