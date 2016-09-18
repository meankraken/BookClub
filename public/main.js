import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';

$(document).ready(function() {
	
	
});

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = { books: [] };
		this.addBook = this.addBook.bind(this);
	}
	
	componentDidMount() {
		if (books) {
			if (books.length>0) {
				this.setState({ books: books });
			}
		}
	}
	
	addBook(event, book) {
		event.preventDefault();
		$('#bookForm')[0].reset();
		$.ajax({
			url:'/main/addBook?book='+book,
			dataType:'json',
			method:'GET',
			success:function(data) {
				console.log(data);
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
	
	render() {
		return (
			<div>
				<SideBar addBook={this.addBook} />
				<MainView books={this.state.books} />
			</div>
		);
	}
	
}

class SideBar extends React.Component {
	constructor(props) {
		super(props);
	}
	
	getTradeRequests() {
		if (received.length==0 && sent.length==0) {
			return (
				<p className="infoText">No trade requests to display.</p>
			);
		}
		else {
			return (
				<div>Trade requests available.</div>
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

class MainView extends React.Component {
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
					return <BookBox book={book} key={book.title + book.owner}/>
					
				})
			
			);
		}
	}
	
	render() {
		return (
			<div id='mainView'>
				<h2>VIEW ALL BOOKS</h2>
				<h5>View all books collected by Bazaar users below. If a book is marked with a <span style={{color:'green'}}>green</span> border, this indicates that you own a copy of it.</h5>
				<h5>You may initiate trades with other users by clicking the trade icon on any book you desire. It's up to them if they will accept!</h5>
				<hr/>
				{this.getBooks()}
			
			</div>
		
		);
	}
	
}

class BookBox extends React.Component {
	constructor(props) {
		super(props);
	}
	
	render() {
		return (
			<div>
				<img src={this.props.book.cover}></img>
			
			</div>
		
		);
		
	}
	
	
}



ReactDOM.render(<App/>, document.querySelector("#app"));