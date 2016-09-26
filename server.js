var express = require('express');
var passport = require('passport');
var session = require('express-session');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var request = require('request');

var app = express();

var url = process.env.MONGOLAB_URI || 'mongodb://localhost/MyDataBase';
var port = process.env.PORT || 8080;
var booksKey = 'AIzaSyA17RbKwiJsmX6FOOOmGUJ4fx9aLqRnjaA';

var Account = require('./models/account.js');
var Book = require('./models/book.js');

mongoose.connect(url);

app.set('views', process.cwd() + "/views");
app.set('view engine', 'jade');

app.use('/public', express.static(process.cwd()+"/public"));
app.use('/build', express.static(process.cwd()+"/build"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(session({
	secret:'topSecret',
	resave:'false',
	saveUninitialized:'false'
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy('local', Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());


app.get('/', function(req,res) {
	res.render('index');
	
});

app.get('/login', function(req,res) {
	if (req.query.failed=="true") {
		res.render('login', {failed: true});
	}
	else {
		res.render('login');
	}
	
});


app.post('/login', passport.authenticate('local', {successRedirect: '/main', failureRedirect: '/login?failed=true' }));

app.get('/logout', function(req,res) {
	req.logout();
	res.redirect('/');
	
});

app.get('/register', function(req,res) {
	res.render('register');
	
});

app.post('/register', function(req,res) {
	Account.register(new Account({username: req.body.username}), req.body.password, function(err, user) {
		if (err) {
			console.log(err);
			res.render('register', {taken: true});
		}
		else {
			req.login(user, function(err) {
				if (err) {
					console.log(err);
				}
				else {
					res.redirect('/main');
				}
			});
		}
		
	});
	
});

app.get('/main', function(req,res) { //main authenticated view 
	if (req.user) {
		Account.findOne({ username: req.user.username}, function(err, user) {
			if (err) {
				console.log(err); 
			}
			else {
				Book.find({}).exec(function(err,docs) {
					if (err) {
						console.log(err);
					}
					else {
						res.render('main', {user: req.user.username, received: user.receivedRequests, sent: user.sentRequests, books: docs });
					}
				});
				
			}
		});
	}
	else {
		res.redirect('/');
	}
	
});

app.get('/main/addBook', function(req,res) { //add a book via add cmd 
	var addFlag = true;
	
	if (req.user.bookList.length>=10) {
		var obj = { title: "maxReached"};
		addFlag = false;
		res.end(JSON.stringify(obj));
	}
	else {
		var book = req.query.book;
		for (var i=0; i<req.user.bookList.length; i++) {
			if (req.user.bookList[i].title == book) {
				res.end(JSON.stringify({ title: "alreadyAdded"}));
				addFlag = false;
			}
		}
		if (addFlag) {
			request({url: 'https://www.googleapis.com/books/v1/volumes?q=' + book + '&projection=lite&maxResults=1&key=' + booksKey}, function(err,response,body) {
				if (err) {
					console.log(err);
				}
				else {
					var bod = JSON.parse(body);
					var theBook = bod.items[0];
					var obj = { title: theBook.volumeInfo.title, description: theBook.volumeInfo.description, owner: req.user.username, cover: theBook.volumeInfo.imageLinks.thumbnail };
					
					var newBook = new Book(obj);
					newBook.save();
					
					Account.findOne({username: req.user.username}, function(err,user) {
						if (err) {
							console.log(err);
						}
						else {
							var acct = user.toObject();
							var list = acct.bookList.slice();
							list.push(obj);
							user.bookList = list.slice();
							user.save(function(err) {
								if (err) {
									console.log(err);
								}
							});
							
							res.end(JSON.stringify(obj));
						}
					}.bind(obj));
					
				}
				
			});
		
		}
	
	}
	
});

app.post('/main/trade', function(req,res) { //initiate trade with another user 
	var targetOwner = req.body.owner; //trade request to
	var targetBook = req.body.title; //trading for
	var bookOffered = req.query.offered; //book offered 
	var duplicate = false;
	var limitReached = false;
	
	req.user.sentRequests.forEach(function(item) {
		if (item.toUser==targetOwner && item.bookOffered==bookOffered && item.bookDesired==targetBook) { //if this is a duplicate trade request
			duplicate = true;
		}
		
	});
	
	if (req.user.sentRequests.length>=5) {
		limitReached = true;
	}
	
	if (duplicate) {
		var obj = { title: 'duplicateRequest' };
		res.end(JSON.stringify(obj));
	}
	else if (limitReached) {
		var obj = { title: 'limitReached' };
		res.end(JSON.stringify(obj));
	}
	else {
		Account.findOne({username: req.user.username}, function(err,user) { //update sent requests for user 
			if (err) {
				console.log(err);
			}
			else {
				var sentTrade = { toUser: targetOwner, bookOffered: bookOffered, bookDesired: targetBook };
				var arr = user.sentRequests.slice();
				arr.push(sentTrade);
				user.sentRequests = arr.slice();
				user.save(); 
			}
			
		});
		
		Account.findOne({username: targetOwner}, function(err,user) { //update received requests for target user 
			if (err) {
				console.log(err);
			}
			else {
				var recTrade = { fromUser: req.user.username, bookOffered: bookOffered, bookDesired: targetBook };
				var arr = user.receivedRequests.slice();
				arr.push(recTrade);
				user.receivedRequests = arr.slice();
				user.save(); 
			}
			
		});
		
		//res.redirect('/main');
		var obj = { title: 'success' };
		res.end(JSON.stringify(obj));
		
	}
	
	
});

app.post('/main/cancelTrade', function(req,res) { //cancel a trade request
	Account.findOne({username:req.user.username}, function(err,user) {
		if (err) {
			console.log(err);
		}
		else {
			var index = -1;
			for (var i=0; i<user.sentRequests.length; i++) {
				if (user.sentRequests[i].toUser==req.body.toUser && user.sentRequests[i].bookOffered==req.body.bookOffered && user.sentRequests[i].bookDesired==req.body.bookDesired) {
					index = i;
				}
			}
			if (index > -1) {
				var arr = user.sentRequests.slice();
				arr.splice(index,1); //remove the request from the user's sentRequests 
				user.sentRequests = arr.slice();
				user.save();
			}
		}
	});
	
	Account.findOne({username:req.body.toUser}, function(err,user) {
		if (err) {
			console.log(err);
		}
		else {
			var index = -1;
			for (var i=0; i<user.receivedRequests.length; i++) {
				if (user.receivedRequests[i].fromUser==req.user.username && user.receivedRequests[i].bookOffered==req.body.bookOffered && user.receivedRequests[i].bookDesired==req.body.bookDesired) {
					index = i;
				}
			}
			if (index > -1) {
				var arr = user.receivedRequests.slice();
				arr.splice(index,1); //remove the request the target user received 
				user.receivedRequests = arr.slice();
				user.save();
			}
		}
	});
	
	var obj = { title: 'success' };
	res.end(JSON.stringify(obj));
	
});

app.post('/main/acceptTrade', function(req,res) {
	Account.find({username: {$in: [req.user.username, req.body.fromUser]}}).exec(function(err,users) { //pull both users involved in trade
		var currentUserIndex = -1; //index of current user
		var otherUserIndex = -1; //index of other user that sent the request
		for (var i=0; i<users.length; i++) {
			if (users[i].username==req.user.username) {
				currentUserIndex = i;
			}
			if (users[i].username==req.body.fromUser) {
				otherUserIndex = i;
			}
		}
		var currentUser = users[currentUserIndex];
		var otherUser = users[otherUserIndex];
		
		//first, update both users activity logs with the completed trade info
		var tradeObj = { tradeType: 'youAccepted', bookOffered: req.body.bookOffered, bookDesired: req.body.bookDesired, fromUser: otherUser.username, toUser: req.user.username };
		currentUser.trades.push(tradeObj);
		
		tradeObj = { tradeType: 'theyAccepted', bookOffered: req.body.bookOffered, bookDesired: req.body.bookDesired, fromUser: req.user.username, toUser: otherUser.username };
		otherUser.trades.push(tradeObj);
		
		
		
		//now remove the requests 
		var index = -1;
			for (var i=0; i<otherUser.sentRequests.length; i++) {
				if (otherUser.sentRequests[i].toUser==req.user.username && otherUser.sentRequests[i].bookOffered==req.body.bookOffered && otherUser.sentRequests[i].bookDesired==req.body.bookDesired) {
					index = i;
				}
			}
			if (index > -1) { //delete the request from the other user's list
				var arr = otherUser.sentRequests.slice();
				arr.splice(index,1); 
				otherUser.sentRequests = arr.slice();
				otherUser.save(); 
			}
			
			index = -1;
			for (var i=0; i<currentUser.receivedRequests.length; i++) {
				if (currentUser.receivedRequests[i].fromUser==req.body.fromUser && currentUser.receivedRequests[i].bookOffered==req.body.bookOffered && currentUser.receivedRequests[i].bookDesired==req.body.bookDesired) {
					index = i;
				}
			}
			if (index > -1) { //delete the request from current user's list
				var arr = currentUser.receivedRequests.slice();
				arr.splice(index,1); 
				currentUser.receivedRequests = arr.slice();
				currentUser.save();
			}
		var userOwns = false; //does user still own book
		var otherUserOwns = false; //does other user still own book
		
		var bookOfferedObj; //vars used to hold the book objects
		var bookDesiredObj;
		
		currentUser.bookList.forEach(function(book) {
			if (book.title == req.body.bookDesired) {
				bookDesiredObj = book; 
				userOwns = true;
			}
			
		});
		
		otherUser.bookList.forEach(function(book) {
			if (book.title == req.body.bookOffered) {
				bookOfferedObj = book;
				otherUserOwns = true;
			}
			
		});
		
		var desiredBookIndex = -1;
		var offeredBookIndex = -1;
		
		if (userOwns && otherUserOwns) { //trade succeeded 
			for (var i=0; i<currentUser.bookList.length; i++) {
				if (currentUser.bookList[i].title == bookDesiredObj.title) {
					desiredBookIndex = i;
				}
			}
			for (var j=0; j<otherUser.bookList.length; j++) {
				if (otherUser.bookList[j].title == bookOfferedObj.title) {
					offeredBookIndex = j;
				}
			}
			
			bookOfferedObj.owner = currentUser.username; //change book owners inside bookLists
			bookDesiredObj.owner = otherUser.username;
			
			currentUser.bookList.splice(desiredBookIndex,1); //swap the books in the user bookLists 
			currentUser.bookList.push(bookOfferedObj);
			currentUser.save();
			
			otherUser.bookList.splice(offeredBookIndex,1);
			otherUser.bookList.push(bookDesiredObj);
			otherUser.save();
			
			Book.find({title:{$in: [bookOfferedObj.title, bookDesiredObj.title]} }).exec(function(err, books) { //swap the books in the books collection
				if (err) {
					console.log(err);
				}
				else {
					var bookOfferedFound = false;
					var bookDesiredFound = false;
					books.forEach(function(book) {
						if (book.title==bookOfferedObj.title && book.owner==req.body.fromUser && !bookOfferedFound) {
							book.owner = currentUser.username; 
							book.save();
							bookOfferedFound = true;
						}
						if (book.title==bookDesiredObj.title && book.owner==req.user.username && !bookDesiredFound) {
							book.owner = otherUser.username; 
							book.save();
							bookDesiredFound = true;
						}
					});
					
					var obj = { title: 'success' };
					res.end(JSON.stringify(obj));
					
				}
				
			});
		
			
		}
		else {
			var obj = { title: 'failure' };
			res.end(JSON.stringify(obj));
		}
		
	});
	
	
	
});

app.post('/main/declineTrade', function(req,res) {
	Account.findOne({username: req.body.fromUser}, function(err,user) { //find and delete the request the other user sent
		if (err) {
			console.log(err);
		}
		else {
			//need to update the target user's trade log 
			var tradeObj = { tradeType: 'theyDeclined', bookOffered: req.body.bookOffered, bookDesired: req.body.bookDesired, fromUser: user.username, toUser: req.user.username };
			if (user.trades) {
				user.trades.push(tradeObj);
				user.save();
			}
			else {
				var tradeArr = user.trades.slice();
				tradeArr.push(tradeObj);
				user.trades = tradeArr.slice();
				user.save();
			}
	
			//now delete the trade request 
			var index = -1;
			for (var i=0; i<user.sentRequests.length; i++) {
				if (user.sentRequests[i].toUser==req.user.username && user.sentRequests[i].bookOffered==req.body.bookOffered && user.sentRequests[i].bookDesired==req.body.bookDesired) {
					index = i;
				}
			}
			if (index > -1) {
				var arr = user.sentRequests.slice();
				arr.splice(index,1); 
				user.sentRequests = arr.slice();
				user.save();
			}
			
			
		}
	});
	
	Account.findOne({username:req.user.username}, function(err,user) { //find and delete the received request from current user's list 
		if (err) {
			console.log(err);
		}
		else {
			var index = -1;
			for (var i=0; i<user.receivedRequests.length; i++) {
				if (user.receivedRequests[i].fromUser==req.body.fromUser && user.receivedRequests[i].bookOffered==req.body.bookOffered && user.receivedRequests[i].bookDesired==req.body.bookDesired) {
					index = i;
				}
			}
			if (index > -1) {
				var arr = user.receivedRequests.slice();
				arr.splice(index,1); 
				user.receivedRequests = arr.slice();
				user.save();
			}
		}
	});
	
	var obj = { title: 'success' };
	res.end(JSON.stringify(obj));
	
});

app.get('/profile', function(req,res) {
	if (req.user) {
		res.render('profile', {user: req.user.username, userInfo: req.user});
	}
	else {
		res.redirect('/');
	}
	
});

app.post('/profile', function(req,res) {
	if (req.user) {
		Account.findOne({ username: req.user.username}, function(err,user) {
			if (err) {
				console.log(err);
			}
			else {
				user.firstName = req.body.firstName; 
				user.lastName = req.body.lastName;
				user.city = req.body.city;
				user.state = req.body.state;
				
				user.save();
				
				res.redirect('/profile');
			}
		});
		
	
	}
	else {
		res.redirect('/');
	}
	
});



app.listen(port, function() {
	console.log("Now listening on " + port);
});





















