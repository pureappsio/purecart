Template.storeProductReview.helpers({

    formatDate: function() {

        return moment(this.date).fromNow();

    },
    isFull: function(star) {

        if (star.type == 'full') {
            return true;
        }

    },
    isHalf: function(star) {

        if (star.type == 'half') {
            return true;
        }

    },
    isEmpty: function(star) {

        if (star.type == 'empty') {
            return true;
        }

    },
    starsRating: function() {

        var stars = [];

        // Full
        var fullStars = Math.trunc(this.rating);
        for (i = 0; i < fullStars; i++) {
            stars.push({ type: 'full' });
        }

        // Half
        var halfStars =  this.rating - fullStars;
        if (halfStars != 0) {
            halfStars = Math.ceil(halfStars);
            for (j = 0; j < halfStars; j++) {
                stars.push({ type: 'half' });
            }
        }

        // Empty
        var emptyStars = 5 - fullStars - halfStars;
        if (emptyStars != 0) {
            for (k = 0; k < emptyStars; k++) {
                stars.push({ type: 'empty' });
            }
        }

        return stars;

    }

});
