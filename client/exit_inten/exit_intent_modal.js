Template.header.helpers({

    contactEmail: function() {
        if (Metas.findOne({type: 'brandEmail'})) {
        	return Metas.findOne({type: 'brandEmail'}).value;
        }
    }

});