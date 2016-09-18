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

app.get('/main', function(req,res) {
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

app.get('/main/addBook', function(req,res) {
	if (req.user.bookList.length>=10) {
		var obj = { title: "maxReached"};
		res.end(JSON.stringify(obj));
	}
	else {
		var book = req.query.book;
		for (var i=0; i<req.user.bookList.length; i++) {
			if (req.user.bookList[i].title == book) {
				res.end(JSON.stringify({ title: "alreadyAdded"}));
			}
		}
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
	
});


app.listen(port, function() {
	console.log("Now listening on " + port);
});





















