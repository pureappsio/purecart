Template.product.onRendered(function() {

    if (this.data) {

        var productId = this.data._id;

        Meteor.call('getSessions', productId, function(err, data) {

            Session.set('sessions-' + productId, data);

        });
    }

});

Template.product.events({

    'click .delete-product': function() {
        Meteor.call('removeProduct', this._id);
    },
    'change .price': function() {

        var data = {
            price: {
                'EUR': parseFloat($('#product-eur-' + this._id).val()),
                'USD': parseFloat($('#product-usd-' + this._id).val())
            }
        }

        Meteor.call('quickEditProduct', this._id, data);
    }

});

Template.product.helpers({

    storeLink: function() {

        if (Meteor.user().role == 'admin') {
            return Meteor.absoluteUrl();
        } else {
            var hostnameArray = document.location.hostname.split(".");
            if (hostnameArray.length == 2) {
                return 'http://' + Meteor.user().domain + '.' + hostnameArray[0] + '.' + hostnameArray[1] + '/';

            } else if (hostnameArray.length == 3) {
                return 'http://' + Meteor.user().domain + '.' + hostnameArray[1] + '.' + hostnameArray[2] + '/';
            }
        }

    },

    isBundle: function() {
        if (this.bundledProducts) {
            return true;
        } else {
            return false;
        }
    },
    sessions: function() {
        return Session.get('sessions-' + this._id);
    },
    sales: function() {
        return Sales.find({
            products: {
                $elemMatch: { $eq: this._id }
            }
        }).fetch().length;
    },
    conversions: function() {

        var sales = Sales.find({
            products: {
                $elemMatch: { $eq: this._id }
            }
        }).fetch().length;

        if (Session.get('sessions-' + this._id) != 0) {
            return (sales / Session.get('sessions-' + this._id) * 100).toFixed(2);
        } else {
            return 0;
        }
    }

});
