Template.header.helpers({

    title: function() {
        return Session.get('title');
    },
    pixel: function() {
        if (Metas.findOne({ type: 'pixel' })) {
            return Metas.findOne({ type: 'pixel' }).value;
        }
    }

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
