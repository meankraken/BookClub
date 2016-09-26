import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';

$(document).ready(function() {
	$(document).on('mouseenter', '.editBtn', function() {
		$(this).css('text-decoration', 'underline');
	});
	$(document).on('mouseleave', '.editBtn', function() {
		$(this).css('text-decoration', '');
	});
	
	
});

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = { userInfo: { }, viewMode: 'view' };
		this.changeMode = this.changeMode.bind(this);
	}
	
	componentDidMount() {
		var obj = { firstName: userInfo.firstName, lastName: userInfo.lastName, city: userInfo.city, state: userInfo.state, trades: userInfo.trades };
		this.setState({ userInfo: obj });
	}
	
	changeMode() {
		if (this.state.viewMode=='view') {
			this.setState({ viewMode: 'edit' });
		}
		else {
			this.setState({ viewMode: 'view' });
		}
	}
	
	render() {
		return (
			<div>
				<AccountInfo userInfo={this.state.userInfo} viewMode={this.state.viewMode} changeMode={this.changeMode} />
			</div>
		);
	}
	
}

class AccountInfo extends React.Component {
	constructor(props) {
		super(props);
	}
	
	render() {
		if (this.props.viewMode=='view') {
			return (
				<div>
					<div id="topBar">
						<h3>Account Details</h3>
						<div className='editBtn' onClick={this.props.changeMode}>edit</div>
					</div>
					
					<div id="infoBody">
						<h4>First Name:</h4> <div className='valueField'>{this.props.userInfo.firstName}</div>
						<hr/>
						<h4>Last Name:</h4><div className='valueField'> {this.props.userInfo.lastName}</div>
						<hr/>
						<h4>City: </h4><div className='valueField'>{this.props.userInfo.city}</div>
						<hr/>
						<h4>State: </h4><div className='valueField'>{this.props.userInfo.state}</div>
						<hr/>
						<ActivityLog trades={this.props.userInfo.trades}/>
						<a id='returnLink' href='/main'>Return to the Bazaar</a>
						<a id='logoutLink' href='/logout'>Logout</a>
					</div>
						
					
				</div>
			);
		}
		else {
			return (
				<div>
					<div id="topBar">
						<h3>Account Details</h3>
						<div className='editBtn' onClick={this.props.changeMode}>cancel</div>
					</div>
					
					<form id="infoForm" method='POST' action='/profile'>
						<div className="form-group">
							<label>First Name: </label>
							<input type='text' name='firstName' defaultValue={this.props.userInfo.firstName} className='form-control' />
						</div>
					
						<div className="form-group">
							<label>Last Name: </label>
							<input type='text' name='lastName' defaultValue={this.props.userInfo.lastName} className='form-control' />
						</div>
						
						<div className="form-group">
							<label>City: </label>
							<input type='text' name='city' defaultValue={this.props.userInfo.city} className='form-control' />
						</div>
						
						<div className="form-group">
							<label>State: </label>
							<input type='text' name='state' defaultValue={this.props.userInfo.state} className='form-control' />
						</div>
						<button type='submit' className='btn btn-primary'>Done</button>
					</form>
				</div>
			);
		}
	}
	
}

class ActivityLog extends React.Component {
	constructor(props) {
		super(props);
	}
	
	getTrades() {
		if (this.props.trades) {
			if (this.props.trades.length>0) {
				var count = 0;
				return (
					this.props.trades.map(function(trade) {
						count++;
						return <Trade trade={trade} key={count} />;
					})
				);
			}
			else {
				return <p>This log will track your trade history. You currently have no completed trades to show.</p>;
			}
		}
		else {
			return <p>This log will track your trade history. You currently have no completed trades to show.</p>;
		}
	}
	
	render() {
		return (
			<div id='activityLog'>
				<h5>ACTIVITY LOG</h5>
				<div className='activityBox'>
					{this.getTrades()}
				</div>
			</div>
		
		);
		
	}
	
}

class Trade extends React.Component {
	constructor(props) {
		super(props);
	}
	
	render() {
		var obj = this.props.trade;
		if (obj.tradeType=='theyAccepted') {
			return (
				<p>{obj.toUser} has accepted your offer. You have traded your copy of <span style={{color:"#37A667"}}>{obj.bookOffered}</span> for <span style={{color:"gold"}}>{obj.bookDesired}</span>.</p> 
			)
		}
		else if (obj.tradeType=='youAccepted') {
			return (
				<p>You have accepted {obj.fromUser}'s offer to trade their copy of <span style={{color:"gold"}}>{obj.bookOffered}</span> for your copy of <span style={{color:"#37A667"}}>{obj.bookDesired}</span>.</p>
			)
		}
		else {
			return (
				<p>{obj.toUser} has <span style={{color:'#F27979'}}>declined</span> your offer to trade your copy of {obj.bookOffered} for their copy of {obj.bookDesired}.</p>
			)
		}
		
	}
}

ReactDOM.render(<App/>, document.querySelector('.profileBox'));









