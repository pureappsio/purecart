Template.storeHeader.helpers({

    emailContact: function() {
        return 'mailto:' + Metas.findOne({ type: 'brandEmail', userId: Session.get('sellerId')  }).value;
    },
    mainPicture: function() {
        return Session.get('mainPicture');
    }

});
