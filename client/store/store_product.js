Template.storeProduct.helpers({
  imageLink: function() {
    if (this.imageId) {
      return Images.findOne(this.imageId).link();
    }
  }
})