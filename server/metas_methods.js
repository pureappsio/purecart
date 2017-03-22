Meteor.methods({

    insertMeta: function(meta) {

        console.log(meta);

        // Check if exist
        if (Metas.findOne({ type: meta.type, userId: meta.userId })) {

            // Update
            console.log('Updating meta');
            Metas.update({ type: meta.type, userId: meta.userId }, { $set: { value: meta.value } });

        } else {

            // Insert
            console.log('Creating new meta');
            Metas.insert(meta);

        }

    }

});