Template.exitIntentModal.helpers({

    contactEmail: function() {
        if (Metas.findOne({ type: 'brandEmail', userId: Session.get('sellerId') })) {
            return Metas.findOne({ type: 'brandEmail', userId: Session.get('sellerId') }).value;
        }
    },
    facebookPage: function() {
        if (Metas.findOne({ type: 'facebookPage', userId: Session.get('sellerId') })) {
            return Metas.findOne({ type: 'facebookPage', userId: Session.get('sellerId') }).value;
        }
    },
    couponDiscount: function() {
        if (Metas.findOne({ type: 'exitIntentDiscount', userId: Session.get('sellerId') })) {
            var discount = Metas.findOne({ type: 'exitIntentDiscount', userId: Session.get('sellerId') }).value;
            return Discounts.findOne(discount).amount;
        }
    },
    couponCode: function() {
        if (Metas.findOne({ type: 'exitIntentDiscount', userId: Session.get('sellerId') })) {
            var discount = Metas.findOne({ type: 'exitIntentDiscount', userId: Session.get('sellerId') }).value;
            return Discounts.findOne(discount).code;
        }
    },
    isFading: function() {
        if (/Mobi/.test(navigator.userAgent)) {
            return ""
        } else {
            return 'fade';
        }
    }

});

Template.exitIntentModal.onRendered(function() {

    // $('.modal-dialog').on('click tap', function(e) {
    //     if ($(e.target).hasClass('modal-dialog')) {
    //         $('.modal').modal('hide');
    //     }
    // })

});

Template.exitIntentModal.events({

    'click #close-offer': function() {
        $("#offer-modal").modal("hide");
    },
    'click #more-help': function() {

        $('#questions-modal').show();
        $('#initial-modal').hide();

    },
    'click #coupon-submit': function() {

        var email = $('#email-coupon').val();

        if (validateEmail(email)) {

            Meteor.call('subscribeEmail', email, function(err, data) {

                // Show next part
                $('#coupon-modal').show();
                $('#initial-modal-coupon').hide();
            });
        }

    }

});

function validateEmail(mail) {
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)) {
        return (true)
    }
    return (false)
}
