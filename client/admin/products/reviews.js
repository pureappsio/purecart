Template.reviews.helpers({

    reviews: function() {
        return Reviews.find({ userId: Meteor.user()._id }, { sort: { date: 1 } });
    },
    products: function() {
        return Products.find({ userId: Meteor.user()._id }, { sort: { name: 1 } });
    }

});


Template.reviews.events({

    'click #add-review': function() {

        var review = {
            userId: Meteor.user()._id,
            date: new Date(),
            rating: parseFloat($('#rating').val()),
            testimonial: $('#testimonial').val(),
            productId: $('#product :selected').val(),
            firstName: $('#first-name').val(),
            lastName: $('#last-name').val()
        }

        Meteor.call('addReview', review);

    }

});
