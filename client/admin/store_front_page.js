Template.storeFrontPage.onRendered(function() {

    // Init
    CKEDITOR.replace('front-text');

});


Template.storeFrontPage.events({

    'click #set-store-front': function() {

        Meteor.call('insertMeta', {
            type: 'useStoreFront',
            value: $('#use-store-front').val()
        });

        Meteor.call('insertMeta', {
            type: 'storeFrontText',
            value: CKEDITOR.instances['front-text'].getData()
        });

        if (Session.get('frontPicture')) {
            Meteor.call('insertMeta', {
                type: 'storeFrontPicture',
                value: Session.get('frontPicture')
            });
        }

        Meteor.call('insertMeta', {
            type: 'storeFrontHeadline',
            value: $('#front-headline').val()
        });
    }

});
