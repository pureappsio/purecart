Template.storeHeader.helpers({

    emailContact: function() {
        return 'mailto:' + Metas.findOne({ type: 'brandEmail' }).value;
    },
    mainPicture: function() {
        return Session.get('mainPicture');
    }

});
