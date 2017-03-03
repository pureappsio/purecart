Template.productInventory.helpers({

    stock: function() {
        if (this.qty) {
            return this.qty;
        } else {
            return 0;
        }
    }

});

Template.productInventory.events({

    'click .minus-stock': function() {
        Meteor.call('modifyStock', this._id, -1);
    },
    'click .plus-stock': function() {
        Meteor.call('modifyStock', this._id, 1);
    }

});
