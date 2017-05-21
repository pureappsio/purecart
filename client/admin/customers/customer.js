Template.customer.helpers({

    locationStyle: function() {

        if (this.country) {

            var country = (this.country).toLowerCase();

            if (country == 'uk') {
                country = 'gb';
            }

            return 'flag-icon-' + country;

        } else {
            return 'flag-icon-us';
        }

    }
});
