Meteor.methods({

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
        // Meteor.users.update({role: 'admin'}, { $set: { payment: paymentType } });
        Meteor.call('insertMeta', { type: 'payment', value: paymentType });

    },
    getPayment: function() {

        if (Metas.findOne({ type: 'payment' })) {
            var payment = Metas.findOne({ type: 'payment' }).value;
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

            // Get lists
            var url = "http://" + integration.url + "/api/courses?key=" + integration.key;
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

    },
    setLanguage: function(language) {

        // Meteor.users.update(Meteor.user()._id, { $set: { language: language } });
        Meteor.call('insertMeta', { type: 'language', value: language });

    },
    checkLanguage: function() {

        if (Metas.findOne({ type: 'language' })) {
            var language = Metas.findOne({ type: 'language' }).value;
        } else {
            var language = 'en';
        }

        return language;

    },
    setBrandData: function(name, email) {

        Meteor.call('insertMeta', { type: 'brandName', value: name });

        Meteor.call('insertMeta', { type: 'brandEmail', value: email });

    },
    getBrandName: function() {
        return Metas.findOne({ type: 'brandName' }).value;
    },
    getBrandEmail: function() {
        return Metas.findOne({ type: 'brandEmail' }).value;
    },
    setTitle: function(title) {

        Meteor.call('insertMeta', { type: 'titlePicture', value: title });

    },
    getTitle: function() {

        if (Metas.findOne({ type: 'titlePicture' })) {
            var pictureId = Metas.findOne({ type: 'titlePicture' }).value;
            return Images.findOne(pictureId).link();
        } else if (Metas.findOne({ type: 'title' })) {
            return Metas.findOne({ type: 'title' }).value;
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
