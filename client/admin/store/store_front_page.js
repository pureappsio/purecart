Template.storeFrontPage.onRendered(function() {

    // Init
    CKEDITOR.replace('front-text');

    var values = ['storefront', 'checkout', 'cart', 'recovery'];

    for (i in values) {

        if (Metas.findOne({ type: values[i] + 'ExitIntent' })) {
            value = Metas.findOne({ type: values[i] + 'ExitIntent' }).value;
        } else {
            value = false;
        }

        if (value == false) {

            $('#' + values[i]).addClass('btn-danger');
            $('#' + values[i]).removeClass('btn-success');
            $('#' + values[i]).html('Off');

        } else {

            $('#' + values[i]).addClass('btn-success');
            $('#' + values[i]).removeClass('btn-danger');
            $('#' + values[i]).html('On');

        }

    }

});

Template.storeFrontPage.helpers({

    isFrontText: function() {
        if (Metas.findOne({ type: 'storeFrontText' })) {

            var text = Metas.findOne({ type: 'storeFrontText' });
            if (text != "") {
                return true;
            }

        }
    }

});

Template.storeFrontPage.events({

    'click .set-popup': function(event, template) {

        // Get ID
        var id = event.target.id;
        var name = id + 'ExitIntent';

        // Get current
        if (Metas.findOne({ type: name })) {
            value = !(Metas.findOne({ type: name }).value);
        } else {
            value = false;
        }

        // Insert
        Meteor.call('insertMeta', {
            type: name,
            value: value,
            userId: Meteor.user()._id
        });

        if (value == false) {

            $('#' + id).addClass('btn-danger');
            $('#' + id).removeClass('btn-success');
            $('#' + id).html('Off');

        } else {

            $('#' + id).addClass('btn-success');
            $('#' + id).removeClass('btn-danger');
            $('#' + id).html('On');

        }

    },
    'click #set-store-front': function() {

        Meteor.call('insertMeta', {
            type: 'useStoreFront',
            value: $('#use-store-front').val(),
            userId: Meteor.user()._id
        });

        Meteor.call('insertMeta', {
            type: 'storeFrontText',
            value: CKEDITOR.instances['front-text'].getData(),
            userId: Meteor.user()._id
        });

        if (Session.get('frontPicture')) {
            Meteor.call('insertMeta', {
                type: 'storeFrontPicture',
                value: Session.get('frontPicture'),
                userId: Meteor.user()._id
            });
        }

        Meteor.call('insertMeta', {
            type: 'storeFrontHeadline',
            value: $('#front-headline').val(),
            userId: Meteor.user()._id
        });
    }

});
