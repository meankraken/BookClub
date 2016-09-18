var mongoose = require('mongoose');
var Schema = mongoose.Schema; 

var Book = new Schema({
    title: String,
	owner: String,
	description: String,
	cover: String
});


module.exports = mongoose.model('Book',Book);