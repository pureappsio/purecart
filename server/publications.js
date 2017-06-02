import Images from '../imports/api/files';

Meteor.publish("userSales", function() {
    return Sales.find({});
});

Meteor.publish("userCustomers", function() {
    return Customers.find({});
});

Meteor.publish("userProducts", function() {
    return Products.find({});
});

Meteor.publish("userVariants", function() {
    return Variants.find({});
});

Meteor.publish("userDiscounts", function() {
    return Discounts.find({});
});

Meteor.publish("userValidations", function() {
    return Validations.find({});
});

Meteor.publish("userElements", function() {
    return Elements.find({});
});

Meteor.publish("userGateways", function() {
    return Integrations.find();
});

Meteor.publish("userAudiences", function() {
    return Audiences.find();
});

Meteor.publish("userIntegrations", function() {
    return Integrations.find({ userId: this.userId });
});

Meteor.publish("userMetas", function() {
    return Metas.find({});
});

Meteor.publish("userReviews", function() {
    return Reviews.find({});
});

Meteor.publish("allUsers", function() {
    return Meteor.users.find({});
});

Meteor.publish('files.images.all', function() {
    return Images.find().cursor;
});
