const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const countySchema = new Schema ({
    name: {
        type: String,
        required: true
    }, 
    weeks: [{
        type: String,
        required: true
    }],
    cases: [{
        type: String,
        required: true
    }]
})

const countyModel = mongoose.model('countyModel', countySchema);

module.exports = countyModel;