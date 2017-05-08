Template.brandDetails.onRendered(function() {

    Meteor.call('getMeta', 'language', function(err, data) {

        $('#language').val(data);

    });

});

Template.brandDetails.events({

    'keyup #store-street': function() {

        Meteor.call('insertMeta', {
            type: 'storeStreet',
            value: $('#store-street').val(),
            userId: Meteor.user()._id
        });

    },
    'keyup #store-zip': function() {

        Meteor.call('insertMeta', {
            type: 'storeZip',
            value: $('#store-zip').val(),
            userId: Meteor.user()._id
        });

    },
    'keyup #store-country': function() {

        Meteor.call('insertMeta', {
            type: 'storeCountry',
            value: $('#store-country').val(),
            userId: Meteor.user()._id
        });

    },
    'keyup #store-city': function() {

        Meteor.call('insertMeta', {
            type: 'storeCity',
            value: $('#store-city').val(),
            userId: Meteor.user()._id
        });

    },
    'click #set-title': function() {

        // Add
        Meteor.call('insertMeta', {
            value: Session.get('titlePicture'),
            type: 'titlePicture',
            userId: Meteor.user()._id
        });

    },
    'click #set-icon': function() {

        // Add
        Meteor.call('insertMeta', {
            value: Session.get('iconPicture'),
            type: 'icon',
            userId: Meteor.user()._id
        });

    },
    'click #set-language': function() {

        // Add
        Meteor.call('insertMeta', {
            value: $('#language :selected').val(),
            type: 'language',
            userId: Meteor.user()._id
        });

    },
    'click #set-brand-data': function() {

        // Add
        Meteor.call('insertMeta', {
            type: 'brandName',
            value: $('#brand-name').val(),
            userId: Meteor.user()._id
        });

        Meteor.call('insertMeta', {
            type: 'brandEmail',
            value: $('#brand-email').val(),
            userId: Meteor.user()._id
        });

    },
    'click #set-pixel': function() {

        // Add
        Meteor.call('insertMeta', {
            type: 'pixel',
            value: $('#facebook-pixel').val(),
            userId: Meteor.user()._id
        });

    },
    'click #set-facebook-ad': function() {

        // Add
        Meteor.call('insertMeta', {
            type: 'adAccountId',
            value: $('#facebook-ad').val(),
            userId: Meteor.user()._id
        });

    },
    'click #set-facebook-page': function() {

        // Add
        Meteor.call('insertMeta', {
            type: 'facebookPage',
            value: $('#facebook-page').val(),
            userId: Meteor.user()._id
        });

    },
    'click #set-tracking': function() {

        // Add
        Meteor.call('insertMeta', {
            type: 'tracking',
            value: $('#google-tracking').val(),
            userId: Meteor.user()._id
        });

    }

});

Template.brandDetails.helpers({

    titleFile: function() {
        if (Session.get('titlePicture')) {
            return 'Uploaded file: ' + Images.findOne(Session.get('titlePicture')).name;
        } else {
            return 'No file uploaded';
        }
    },
    iconFile: function() {
        if (Session.get('iconPicture')) {
            return 'Uploaded file: ' + Images.findOne(Session.get('iconPicture')).name;
        } else {
            return 'No file uploaded';
        }
    }

});
