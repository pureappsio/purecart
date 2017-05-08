Template.discount.events({

    'click .delete-discount': function() {
        Meteor.call('removeDiscount', this._id);
    }

});

Template.discount.helpers({

    formatDate: function() {
        if (this.expiryDate) {
            return moment(this.expiryDate).format('MMMM Do YYYY, hh a');
        } else {
            return 'Valid';
        }

    },
    restriction: function() {
        if (this.productId) {
            return '(Restricted to ' + Products.findOne(this.productId).name + ')';
        }
    }

});
