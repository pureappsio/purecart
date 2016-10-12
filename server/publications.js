Meteor.publish("userSales", function () {
	return Sales.find({});
});

Meteor.publish("userCustomers", function () {
	return Customers.find({});
});

Meteor.publish("userProducts", function () {
	return Products.find({});
});