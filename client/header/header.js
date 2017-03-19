Template.header.helpers({

    title: function() {
        return Session.get('title');
    },
    pixel: function() {
        if (Metas.findOne({ type: 'pixel' })) {
            return Metas.findOne({ type: 'pixel' }).value;
        }
    },
    tracking: function() {
        if (Metas.findOne({ type: 'tracking' })) {
            return Metas.findOne({ type: 'tracking' }).value;
        }
    }
    // addToCart: function() {
    //     if (Session.get('pixelTrackingPage')) {
    //         if (Session.get('pixelTrackingPage') == 'cart') {
    //             return true;
    //         }
    //     }
    // },
    // InitiateCheckout: function() {
    //     if (Session.get('pixelTrackingPage')) {
    //         if (Session.get('pixelTrackingPage') == 'checkout') {
    //             return true;
    //         }
    //     }
    // },
    // Purchase: function() {
    //     if (Session.get('pixelTrackingPage')) {
    //         if (Session.get('pixelTrackingPage') == 'purchase') {
    //             return true;
    //         }
    //     }
    // }

});

Template.header.rendered = function() {

    Meteor.call('getTitle', function(err, data) {
        Session.set('title', data);
    });

    // Meteor.call('checkLanguage', function(err, data) {
    //     console.log(data);
    //     accountsUIBootstrap3.setLanguage(data);
    // });

}
