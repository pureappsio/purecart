Template.review.events({

    'click .delete-review': function() {
        Meteor.call('removeReview', this._id);
    }

});

Template.review.helpers({

    productName: function() {
        return Products.findOne(this.productId).name;
    }

});

