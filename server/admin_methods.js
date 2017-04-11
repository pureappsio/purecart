Meteor.methods({

    addReview: function(review) {

        console.log(review);
        Reviews.insert(review);

    },
    removeReview: function(reviewId) {

        Reviews.remove(reviewId);

    },
    getSessions: function(productId) {

        return Sessions.find({ productId: productId, type: 'checkout' }).fetch().length;

    },
    editVariant: function(variant) {

        console.log(variant);

        Variants.update(variant._id, { $set: variant });

    },
    updateApp: function() {

        // console.log('Update');
        Metas.update({}, { $set: { userId: Meteor.user()._id } }, { multi: true });
        Products.update({}, { $set: { userId: Meteor.user()._id } }, { multi: true });
        Variants.update({}, { $set: { userId: Meteor.user()._id } }, { multi: true });
        Sales.update({}, { $set: { userId: Meteor.user()._id } }, { multi: true });
        Customers.update({}, { $set: { userId: Meteor.user()._id } }, { multi: true });

        Validations.update({}, { $set: { userId: Meteor.user()._id } }, { multi: true });
        Sessions.update({}, { $set: { userId: Meteor.user()._id } }, { multi: true });

        Discounts.update({}, { $set: { userId: Meteor.user()._id } }, { multi: true });
        Elements.update({}, { $set: { userId: Meteor.user()._id } }, { multi: true });

        Gateways.update({}, { $set: { userId: Meteor.user()._id } }, { multi: true });

    },
    getCartTitle: function(userId) {

        if (Metas.findOne({ type: 'brandName', userId: userId })) {
            var title = Metas.findOne({ type: 'brandName', userId: userId }).value;

        } else {
            var title = 'PureCart';
        }

        return title;

    },
    getCartIcon: function(userId) {

        if (Metas.findOne({ type: 'icon', userId: userId })) {
            var iconId = Metas.findOne({ type: 'icon', userId: userId }).value;
            var icon = Images.findOne(iconId).link();

        } else {
            var icon = '/favicon.png?v=2';
        }

        return icon;

    },
    getUserDomain: function(domain) {

        console.log('Domain:' + domain);

        if (domain == 'admin') {
            return Meteor.users.findOne({ role: domain });
        } else {
            if (Meteor.users.findOne({ domain: domain })) {
                return Meteor.users.findOne({ domain: domain });
            } else {
                return Meteor.users.findOne({ role: 'admin' });
            }
        }

    },

    setUserDomain: function(domain) {

        Meteor.users.update(Meteor.user()._id, { $set: { domain: domain } });

        console.log(Meteor.user());

    },

    createUserAccount: function(data) {

        console.log(data);

        // Check if exist
        if (Meteor.users.findOne({ "emails.0.address": data.email })) {

            console.log('Updating existing app user');
            var userId = Meteor.users.findOne({ "emails.0.address": data.email })._id;

        } else {

            console.log('Creating new app user');

            // Create
            var userId = Accounts.createUser({
                email: data.email,
                password: data.password
            });

            // Assign role
            Meteor.users.update(userId, { $set: { role: data.role } });

        }

        return userId;

    },

    modifyStock: function(productId, increment) {

        console.log(productId);

        // Check if it exists
        if (!Products.findOne({ _id: productId, qty: { $exists: true } })) {

            Products.update(productId, { $set: { 'qty': 0 } });

        }

        // Update
        Products.update(productId, { $inc: { 'qty': increment } });

    },
    insertVariant: function(variant) {

        console.log(variant);
        Variants.insert(variant);

    },
    removeVariant: function(variantId) {

        Variants.remove(variantId);

    },

    quickEditProduct(productId, data) {

        console.log(data);

        // Update
        Products.update(productId, { $set: { price: data.price } });

    },
    insertElement: function(element) {

        // Order
        var elements = Elements.find({ type: element.type, productId: element.productId }).fetch();
        element.order = elements.length + 1;

        console.log(element);

        Elements.insert(element);

    },
    deleteElement: function(elementId) {

        Elements.remove(elementId);

    },
    generateShortName: function(product) {

        if (!(product.shortName)) {

            // Get short name
            var shortName = (product.name).toLowerCase();
            shortName = shortName.replace(" ", "-");

            // Update
            Products.update(product._id, { $set: { shortName: shortName } });

        }

    },
    generateShortNames: function() {

        var products = Products.find({}).fetch();

        for (i = 0; i < products.length; i++) {

            Meteor.call('generateShortName', products[i]);

        }

    },
    setPayment: function(paymentType) {

        // Set
        Meteor.call('insertMeta', {
            type: 'payment',
            value: paymentType,
            userId: Meteor.user()._id
        });

    },
    getPayment: function(userId) {

        if (Metas.findOne({ type: 'payment', userId: userId })) {
            var payment = Metas.findOne({ type: 'payment', userId: userId }).value;
        } else {

            // Default to paypal
            var payment = 'paypal';
        }

        return payment;

    },
    setList: function(list) {

        // Update
        Integrations.update({ type: 'puremail' }, { $set: { list: list } });

    },
    getEmailLists: function() {

        // Get integration
        if (Integrations.findOne({ type: 'puremail' })) {

            var integration = Integrations.findOne({ type: 'puremail' });

            // Get lists
            var url = "http://" + integration.url + "/api/lists?key=" + integration.key;
            var answer = HTTP.get(url);
            return answer.data.lists;

        } else {
            return [];
        }

    },
    getCourses: function() {

        // Get integration
        if (Integrations.findOne({ type: 'purecourses' })) {

            var integration = Integrations.findOne({ type: 'purecourses' });

            // Get course
            var url = "http://" + integration.url + "/api/courses?key=" + integration.key;

            if (Meteor.user().role != 'admin') {
                url += '&user=' + Meteor.user().emails[0].address;
            }
            console.log(url);

            var answer = HTTP.get(url);
            // console.log(answer.data.courses);
            return answer.data.courses;

        } else {
            return [];
        }

    },
    getModules: function(courseId) {

        console.log('Grabbing modules');

        // Get integration
        if (Integrations.findOne({ type: 'purecourses' })) {

            var integration = Integrations.findOne({ type: 'purecourses' });

            // Get lists
            var url = "http://" + integration.url + "/api/modules?key=" + integration.key;
            url += '&course=' + courseId;
            url += '&user=' + Meteor.user().emails[0].address;
            var answer = HTTP.get(url);
            //console.log(answer.data.modules);
            return answer.data.modules;

        } else {
            return [];
        }

    },
    getBonuses: function(courseId) {

        // Get integration
        if (Integrations.findOne({ type: 'purecourses' })) {

            var integration = Integrations.findOne({ type: 'purecourses' });

            // Get lists
            var url = "http://" + integration.url + "/api/bonuses?key=" + integration.key;
            url += '&course=' + courseId;
            url += '&user=' + Meteor.user().emails[0].address;
            console.log(url);
            var answer = HTTP.get(url);
            // console.log(answer.data.courses);
            return answer.data.bonuses;

        } else {
            return [];
        }

    },
    editSale: function(sale) {

        // Update
        Sales.update(sale._id, {
            $set: {
                success: sale.success,
                subtotal: sale.subtotal,
                amount: sale.amount,
                tax: sale.tax
            }
        });

    },
    getIntegrations: function() {

        return Integrations.find({}).fetch();

    },
    addIntegration: function(data) {

        // Insert
        Integrations.insert(data);

    },
    removeIntegration: function(data) {

        // Insert
        Integrations.remove(data);

    },
    removeDiscount: function(discountId) {

        // Add
        Discounts.remove(discountId);

    },
    createDiscount: function(discount) {

        // Add
        console.log(discount);
        discountId = Discounts.insert(discount);

        return discountId;

    },
    validateApiKey: function(key) {

        var adminUser = Meteor.users.findOne({ role: 'admin', apiKey: { $exists: true } });

        if (adminUser.apiKey == key) {
            return true;
        } else {
            return false;
        }

    },
    generateApiKey: function() {

        // Check if key exist
        if (!Meteor.user().apiKey) {

            // Generate key
            var key = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            for (var i = 0; i < 16; i++) {
                key += possible.charAt(Math.floor(Math.random() * possible.length));
            }
            console.log(key);

            // Update user
            Meteor.users.update(Meteor.user()._id, { $set: { apiKey: key } });
        }

    },

    removeSale: function(saleId) {

        Sales.remove(saleId);

    },
    removeProduct: function(productId) {

        Products.remove(productId);

    },
    editProduct: function(product) {

        console.log(product);
        Products.update(product._id, product);

        // If physical, create/update on shipwire
        var product = Products.findOne(product._id);

        // if (product.shipwireId) {

        //     Meteor.call('updateShipwireProduct', product);
        // } else {
        //     var shipwireId = Meteor.call('createShipwireProduct', product);
        //     Products.update(product._id, { $set: { shipwireId: shipwireId } });
        // }

    },
    setLanguage: function(language) {

        // Meteor.users.update(Meteor.user()._id, { $set: { language: language } });
        Meteor.call('insertMeta', { type: 'language', value: language });

    },
    checkLanguage: function(userId) {

        if (Metas.findOne({ type: 'language', userId: userId })) {
            var language = Metas.findOne({ type: 'language', userId: userId }).value;
        } else {
            var language = 'en';
        }

        return language;

    },

    getBrandName: function(userId) {
        return Metas.findOne({ type: 'brandName', userId: userId }).value;
    },
    getBrandEmail: function(userId) {
        return Metas.findOne({ type: 'brandEmail', userId: userId }).value;
    },

    getTitle: function(userId) {

        if (Metas.findOne({ type: 'titlePicture', userId: userId })) {
            var pictureId = Metas.findOne({ type: 'titlePicture', userId: userId }).value;
            return Images.findOne(pictureId).link();
        }

    },
    addProduct(product) {

        // Add
        var productId = Products.insert(product);

        // Generate short name
        var product = Products.findOne(productId);
        console.log(product);
        Meteor.call('generateShortName', product);

    }

});
