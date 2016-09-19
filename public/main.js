import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';

$(document).ready(function() {
	$(document).on('mouseenter', '.tradeBtn', function() {
		$(this).css('background-color', 'rgba(22,179,22,1)');
	});
	$(document).on('mouseleave', '.tradeBtn', function() {
		$(this).css('background-color', '');
	});
	
});

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = { books: [], sentRequests: [], receivedRequests: [], targetBook: { title: 'noBookSelected' } };
		this.addBook = this.addBook.bind(this);
		this.tradeFor = this.tradeFor.bind(this);
		this.confirmTrade = this.confirmTrade.bind(this);
		this.cancelTrade = this.cancelTrade.bind(this);
		this.cancelTradeRequest = this.cancelTradeRequest.bind(this);
		this.acceptTrade = this.acceptTrade.bind(this);
		this.declineTrade = this.declineTrade.bind(this);
	}
	
	componentDidMount() {
		var bookArr = [];
		var sentArr = [];
		var recArr = [];
		if (books) {
			if (books.length>0) {
				bookArr = books.slice();
			}
		}
		if (sent) {
			if (sent.length>0) {
				sentArr = sent.slice();
			}
		}
		if (received) {
			if (received.length>0) {
				recArr = received.slice();
			}
		}
		this.setState({ books: bookArr.slice(), sentRequests: sentArr.slice(), receivedRequests: recArr.slice() });
	}
	
	addBook(event, book) { //add a book via cmd
		event.preventDefault();
		$('#bookForm')[0].reset();
		$.ajax({
			url:'/main/addBook?book='+book,
			dataType:'json',
			method:'GET',
			success:function(data) {
				if (data.title=='maxReached') {
					alert('Limit of 10 books has been reached');
				}
				else if (data.title=='alreadyAdded') {
					alert('You have already added this book to your collection.');
				}
				else {
					var arr = this.state.books.slice();
					arr.push(data);
					this.setState({ books: arr.slice() });
				}
			}.bind(this),
			failure:function(err) {
				console.log(err);
			}
			
		});
		
	}
	
	tradeFor(book) { //show trade popup
		var hasBook = false;
		this.state.books.forEach(function(book) {
			if (book.owner==user) {
				hasBook = true;
			}
			return;
			
		});
		if (hasBook) {
			this.setState({ targetBook: book });
		}
		else {
			alert("You do not have any books to trade. Add some books to your collection using the command center toolbar.");
		}
	}
	
	confirmTrade() { //execute the trade request 
		$.ajax({
			url:'/main/trade?offered=' + $('#bookOffered').val(),
			method:'POST',
			data:this.state.targetBook,
			success:function(data) {
				var result = JSON.parse(data).title;
				if (result=='duplicateRequest') { 
					alert('This is a duplicate request. Please select another book and retry.');
				}
				else if (result=='limitReached') {
					alert('You have already initiated 5 trade requests. Please cancel any old requests to continue trading.');
				}
				else if (result=='success') {
					window.location = '/main';
					this.setState({ targetBook: { title: 'noBookSelected' }});
				}
				
			}.bind(this),
			failure:function(err) {
				console.log(err);
			} 
			
		});
		
	}
	
	cancelTrade() { //close trade menu, cancel request initiation
		this.setState({ targetBook: { title: 'noBookSelected' }});
	}
	
	cancelTradeRequest(TR) { //cancel an existing trade request 
		$.ajax({
			url:'/main/cancelTrade',
			method:'POST',
			data: TR,
			success:function(data) {
				var result = JSON.parse(data);
				if (result.title=='success') {
					var index = -1;
					var arr = this.state.sentRequests.slice();
					
					for (var i=0; i<arr.length; i++) {
						if (arr[i].toUser==TR.toUser && arr[i].bookOffered==TR.bookOffered && arr[i].bookDesired==TR.bookDesired) {
							index = i;
						}
					}
					
					if (index > -1) {
						arr.splice(index,1);
						this.setState({ sentRequests: arr.slice() });
					}
				}
			}.bind(this),
			failure:function(err) {
				console.log(err);
			}
			
		});
	}
	
	acceptTrade(TR) { //accept a received trade request
		$.ajax({
			url:'/main/acceptTrade',
			method:'POST',
			data:TR,
			success:function(data) {
				var result = JSON.parse(data).title;
				if (result == 'success') {
					window.location = '/main';
				}
				else if (result == 'failure') {
					alert("Book is no longer owned by this user. Cancelling trade.");
				}
			},
			failure:function(err) {
				console.log(err);
			}
			
		});
		
	}
	
	declineTrade(TR) { //decline a received trade request
		$.ajax({
			url:'/main/declineTrade',
			method:'POST',
			data:TR,
			success:function(data) {
				var result = JSON.parse(data);
				if (result.title=='success') {
					var index = -1;
					var arr = this.state.receivedRequests.slice();
					
					for (var i=0; i<arr.length; i++) {
						if (arr[i].fromUser==TR.fromUser && arr[i].bookOffered==TR.bookOffered && arr[i].bookDesired==TR.bookDesired) {
							index = i;
						}
					}
					
					if (index > -1) {
						arr.splice(index,1);
						this.setState({ receivedRequests: arr.slice() });
					}
				}
			}.bind(this),
			failure:function(err) {
				console.log(err);
			}
			
		});
		
	}
	
	render() {
		if (this.state.targetBook.title != 'noBookSelected') {
			$('#mask').css('display','block');
			return (
				<div>
					<SideBar addBook={this.addBook} sentRequests={this.state.sentRequests} receivedRequests={this.state.receivedRequests} cancelTradeRequest={this.cancelTradeRequest} acceptTrade={this.acceptTrade} declineTrade={this.declineTrade} />
					<MainView books={this.state.books} tradeFor={this.tradeFor} />
					<TradeMenu books={this.state.books} targetBook={this.state.targetBook} confirmTrade={this.confirmTrade} cancelTrade={this.cancelTrade} />
				</div>
			);
		}
		else {
			$('#mask').css('display','none');
			return (
				<div>
					<SideBar addBook={this.addBook} sentRequests={this.state.sentRequests} receivedRequests={this.state.receivedRequests} cancelTradeRequest={this.cancelTradeRequest} acceptTrade={this.acceptTrade} declineTrade={this.declineTrade} />
					<MainView books={this.state.books} tradeFor={this.tradeFor} />
				</div>
			);
		}
	}
	
}

class SideBar extends React.Component { //user toolbar
	constructor(props) {
		super(props);
	}
	
	getTradeRequests() { //pull all received and sent trade requests
		if (this.props.receivedRequests.length==0 && this.props.sentRequests.length==0) { 
			return (
				<p className="infoText">No trade requests to display.</p>
			);
		}
		else {
			var recArr = this.props.receivedRequests.map(function(trade) {
				return <RecTrade key={trade.fromUser + trade.bookOffered + trade.bookDesired} data={trade} acceptTrade={this.props.acceptTrade} declineTrade={this.props.declineTrade} />;
			}.bind(this));
			var sentArr = this.props.sentRequests.map(function(trade) {
				return <SentTrade key={trade.toUser + trade.bookOffered + trade.bookDesired} data={trade} cancelTradeRequest={this.props.cancelTradeRequest} />;
			}.bind(this));
			
			
			return (
				<div>
					{recArr}
					{sentArr}
				</div>
			);
		}
	}
	
	render() {
		return (
			<div id="sideBar"> 
				<div id="icon">
					<span id="topIcon">B</span>
					<p id="bottomIcon">B</p>
				</div>
				<p className='smallText'>BAZAAR COMMAND CENTER</p>
				<hr/>
				<p className='cmdText'>Add Book</p>
				<p className='hintText'>[This command will search and add a book of your choosing to your collection. You may add up to 10 books.]</p>
				<form id='bookForm' onSubmit={(event) => this.props.addBook(event, $('#bookInput').val())}> 
					<input id='bookInput' type='text'></input>
				</form>
				<p className='cmdText'>Your Trade Requests</p>
				<p className='hintText'>[This section will display the trade requests you've received as well as the ones you've sent.]</p>
				{this.getTradeRequests()}
			</div>
		);
	}
	
}

class RecTrade extends React.Component { //received trade infobox
	constructor(props) {
		super(props);
	}
	
	render() {
		return (
			<div className='tradeBox'>
				<p>{this.props.data.fromUser} would like to trade their copy of <span className='targetBook'>{this.props.data.bookOffered}</span> for your copy of <span className='userBook'>{this.props.data.bookDesired}</span>.</p>

				<div className='btnRow'>
					<div className='tradeOption acceptOpt' onClick={() => this.props.acceptTrade(this.props.data)}>Accept</div>
					<div className='tradeOption declineOpt' onClick={() => this.props.declineTrade(this.props.data)}>Decline</div>
				</div>
			</div>		
		);
		
	}
	
}

class SentTrade extends React.Component { //sent trade infobox
	constructor(props) {
		super(props);
	}
	
	render() {
		return (
			<div className='tradeBox'>
				<p>You have requested to trade your copy of <span className='userBook'>{this.props.data.bookOffered}</span> for {this.props.data.toUser}'s copy of <span className='targetBook'>{this.props.data.bookDesired}</span>.</p>
				<div className='tradeOption cancelOpt' onClick={() => this.props.cancelTradeRequest(this.props.data)}>Cancel</div>
			</div>		
		);
		
	}
	
}

class MainView extends React.Component { //book view 
	constructor(props) {
		super(props);
	}
	
	getBooks() {
		if (this.props.books.length==0) {
			return <h1 id="noBooks">There are no books in the Bazaar. Be the first to add one!</h1>;
		}
		else {
			return (
				this.props.books.map(function(book) {
					return <BookBox book={book} key={book.title + book.owner} tradeFor={this.props.tradeFor}/>
					
				}.bind(this))
			
			);
		}
	}
	
	render() {
		return (
			<div id='mainView'>
				<h2>VIEW ALL BOOKS</h2>
				<h5>View all books collected by Bazaar users below. If a book is marked with a <span style={{color:'green'}}>green</span> border, this indicates that you own a copy of it.</h5>
				<h5>You may initiate trades with other users by clicking the trade icon on any book you desire. It's up to them if they will accept!</h5>
				<p style={{'fontSize':'.75em'}}>Note: You may have up to a total of 5 active trade requests initiated. After the limit is reached, other users can still initiate trades with you.</p>
				<hr/>
				{this.getBooks()}
			
			</div>
		
		);
	}
	
}

class BookBox extends React.Component { //book component
	constructor(props) {
		super(props);
	}
	
	render() {
		if (user == this.props.book.owner) {
			return (
			<div className='bookBox'>
				<img className='ownedBook' src={this.props.book.cover}></img>
			
			</div>
		
		);
		}
		return (
			<div className='bookBox'>
				<img src={this.props.book.cover}></img>
				<div className='tradeBtn' onClick={ () => this.props.tradeFor(this.props.book) } >+</div>
			</div>
		
		);
		
	}
	
}

class TradeMenu extends React.Component { //trade menu popup component
	constructor(props) {
		super(props);
		this.getOptions = this.getOptions.bind(this);
	}
	
	getOptions() {
		var count = 0;
		return (
			this.props.books.map(function(book) {
				if (book.owner == user) {
					count++;
					return <option key={book.title+count}>{book.title}</option>;
				}
				
			}.bind(this))
			
		);
		
	}
	
	render() {
		return (
			<div className='tradePopup'>
				<div id='topBar'>
					<p>Initiating Trade</p>
				</div>
				<div id='leftBar'>
					<img src={this.props.targetBook.cover} />
				</div>
				<div id='rightBar'>
					<p>Select a book to trade:</p>
					<select id='bookOffered'>
						{this.getOptions()}
					</select>
					<div id='btnRow'>
						<button className='btn btn-primary confirmBtn' onClick={this.props.confirmTrade}>Confirm</button>
						<button className='btn btn-default cancelBtn' onClick={this.props.cancelTrade}>Cancel</button>
					</div>
				</div>
			</div>
			
		);
		
	}
	
}



ReactDOM.render(<App/>, document.querySelector("#app"));