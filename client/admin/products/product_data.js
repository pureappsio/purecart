Template.productData.helpers({
  image: function() {
    if (this.imageId) {
      return true;
    }
    else {
      return false;
    }
  },
  imageLink: function() {
    if (this.imageId) {
      return Images.findOne(this.imageId).link();
    }
  }
})