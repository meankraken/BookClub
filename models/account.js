var mongoose = require('mongoose');
var Schema = mongoose.Schema; 
var passportLocalMongoose = require('passport-local-mongoose');

var BazaarAccount = new Schema({
    username: String,
    password: String,
	bookList: [{ title: String, description:String, owner: String, cover: String}],
	sentRequests: [{ toUser: String, bookOffered: String, bookDesired: String }],
	receivedRequests: [{ fromUser: String, bookOffered: String, bookDesired: String }],
    firstName: String,
	lastName: String,
	city: String,
	state: String,
	trades: [{ tradeType: String, bookOffered: String, bookDesired: String, fromUser: String, toUser: String }]
});

BazaarAccount.plugin(passportLocalMongoose);

module.exports = mongoose.model('BazaarAccount',BazaarAccount);