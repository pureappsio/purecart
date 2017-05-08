setDiscount = function(query) {

    if (query.discount) {

        // Get code
        if (Discounts.findOne({ code: query.discount })) {
            var discount = Discounts.findOne({ code: query.discount });

            if (discount.expiryDate) {

                // Check if expired 
                var currentDate = new Date();
                var expiryDate = new Date(discount.expiryDate);
                if (currentDate.getTime() < expiryDate.getTime()) {
                    Session.setTemp('usingDiscount', discount);
                }

            } else {
                Session.setTemp('usingDiscount', discount);
            }

        }

    }

}

getSessionData = function(parameters) {

    // Insert session
    session = {
        date: new Date(),
        type: parameters.type,
        country: Session.get('countryCode'),
        userId: Session.get('sellerId')
    };

    if (parameters.productId) {
        session.productId = parameters.productId;
    }

    // Mobile or Desktop
    if (/Mobi/.test(navigator.userAgent)) {
        session.browser = 'mobile';
    } else {
        session.browser = 'desktop';
    }

    // Origin & medium
    if (Session.get('origin')) {
        session.origin = Session.get('origin');
    } else {
        session.origin = 'organic';
    }
    if (Session.get('medium')) {
        session.medium = Session.get('medium');
    }

    return session;

}

computePrice = function(price) {

    if (price[Session.get('currency')]) {
        return price[Session.get('currency')];
    } else {
        var rates = Metas.findOne({ type: 'rates' }).value;
        var finalPrice = price.EUR * rates[Session.get('currency')];
        console.log(finalPrice);
        return parseFloat(finalPrice.toFixed(0) + '.99');
    }

}

getBasePrice = function(item) {

    var price = computePrice(item.price);

    // Apply discount
    price = applyDiscount(price, item._id);

    // Calculate base price
    if (Session.get('useTaxes') == true) {
        price = price * (1 - Session.get('tax') / 100);
    }

    return price.toFixed(2);

}

applyDiscount = function(price, productId) {

    if (Session.get('usingDiscount')) {

        var discount = Session.get('usingDiscount');
        discounted = true;

        if (typeof productId !== 'undefined') {
            if (discount.productId) {
                if (discount.productId != productId) {
                    discounted = false;
                }
            }

        }

        if (discounted == true) {
            if (discount.type == 'amount') {
                price = price - parseFloat(Session.get('usingDiscount').amount);
            } else {
                price = price * (1 - parseFloat(Session.get('usingDiscount').amount) / 100);
            }
        }

    }

    return price;

}

showExitIntent = function(event, location, type) {

    // Exit intent
    if (Metas.findOne({ type: location + 'ExitIntent', userId: Session.get('sellerId') })) {

        if (Metas.findOne({ type: location + 'ExitIntent', userId: Session.get('sellerId') }).value == true) {

            if (event.pageY < 10 && Session.get(location + 'ExitIntent') == 'armed') {

                Session.set(location + 'ExitIntent', 'fired');

                if (type == 'offer') {
                    $('#offer-modal').modal('show');
                }

                if (type == 'help') {
                    $('#help-modal').modal('show');
                }

            }
        }

    }

}

showMobileExitIntent = function(percent, location, type) {

    // Exit intent
    if (Metas.findOne({ type: location + 'ExitIntent', userId: Session.get('sellerId') })) {

        if (Metas.findOne({ type: location + 'ExitIntent', userId: Session.get('sellerId') }).value == true) {

            if (percent > 50) {
                Session.set('scrollTrigger', true);
            }

            if (Session.get('scrollTrigger') == true && percent < 45 && Session.get(location + 'ExitIntent') == 'armed') {
            // if (Session.get('scrollTrigger') == true && percent < 45) {

                Session.set(location + 'ExitIntent', 'fired');

                if (type == 'offer') {
                    $('#offer-modal').modal('show');
                }

                if (type == 'help') {
                    $('#help-modal').modal('show');
                }
            }


        }

    }

}
