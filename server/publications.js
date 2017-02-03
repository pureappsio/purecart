Meteor.publish("userSales", function () {
	return Sales.find({});
});

Meteor.publish("userCustomers", function () {
	return Customers.find({});
});

Meteor.publish("userProducts", function () {
	return Products.find({});
});

Meteor.publish("userVariants", function () {
	return Variants.find({});
});

Meteor.publish("userDiscounts", function () {
	return Discounts.find({});
});

Meteor.publish("userValidations", function () {
	return Validations.find({});
});

Meteor.publish("userMetas", function () {
	return Metas.find({});
});

// Meteor.publish("userSessions", function () {
// 	return Sessions.find({});
// });

Meteor.publish("userElements", function () {
	return Elements.find({});
});

Meteor.publish("userIntegrations", function () {
	return Integrations.find({});
});

Meteor.publish("allUsers", function () {
	return Meteor.users.find({});
});

 Meteor.publish('files.images.all', function () {
    return Images.find().cursor;
  });