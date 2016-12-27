Meteor.startup(function () {

  process.env.MAIL_URL = Meteor.settings.MAIL_URL;

  	// Create users if needed
	Meteor.call('createUsers');

});
