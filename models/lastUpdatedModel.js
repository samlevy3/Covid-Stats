const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const lastUpdatedSchema = new Schema ({
    name: {
        type: String,
        required: true
    }, 
    date: {
        type: Object,
        required: true
    },
    status: {
        type: Number,
        required: true
    }
})

const lastUpdatedModel = mongoose.model('lastUpdatedModel', lastUpdatedSchema);

module.exports = lastUpdatedModel;