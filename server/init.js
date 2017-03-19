Meteor.startup(function() {

	// Mail
    process.env.MAIL_URL = Meteor.settings.MAIL_URL;

    // Create users if needed
    Meteor.call('createUsers');

    // Grab conversion rates
    Meteor.call('updateConversionRates');

});
