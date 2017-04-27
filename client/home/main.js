import 'bootstrap';
import '/node_modules/bootstrap/dist/css/bootstrap.min.css'
import 'chart.js';

history.pushState(null, "", location.href.split("?")[0]);

const Spinner = require('spin');

// Template.main.helpers({



// });

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

showExitIntent = function(event, location, type) {

    // Exit intent
    if (Metas.findOne({ type: location + 'ExitIntent' })) {

        if (Metas.findOne({ type: location + 'ExitIntent' }).value == true) {
            if (event.pageY < 10 && Session.get('storeExitIntent') == false) {
                Session.set('storeExitIntent', true);

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
