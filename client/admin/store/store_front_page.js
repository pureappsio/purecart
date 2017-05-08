Template.storeFrontPage.onRendered(function() {

    // Init
    CKEDITOR.replace('front-text');

    var values = ['storefront', 'checkout', 'cart', 'recovery'];

    for (i in values) {

        if (Metas.findOne({ type: values[i] + 'ExitIntent', userId: Meteor.user()._id })) {
            value = Metas.findOne({ type: values[i] + 'ExitIntent', userId: Meteor.user()._id }).value;
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
        if (Metas.findOne({ type: 'storeFrontText', userId: Meteor.user()._id })) {

            var text = Metas.findOne({ type: 'storeFrontText', userId: Meteor.user()._id });
            if (text != "") {
                return true;
            }

        }
    },
    discounts: function() {
        return Discounts.find({ userId: Meteor.user()._id });
    }

});

Template.storeFrontPage.events({

    'click #discount-coupon': function() {

        Meteor.call('insertMeta', {
            type: 'exitIntentDiscount',
            value: $('#discount-coupon-id :selected').val(),
            userId: Meteor.user()._id
        });

    },
    'click .set-popup': function(event, template) {

        // Get ID
        var id = event.target.id;
        var name = id + 'ExitIntent';

        // Get current
        if (Metas.findOne({ type: name, userId: Meteor.user()._id })) {
            value = !(Metas.findOne({ type: name, userId: Meteor.user()._id }).value);
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
