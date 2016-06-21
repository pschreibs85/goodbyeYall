'use strict'

import React from 'react';
import ReactDOM from 'react-dom';
import D3CacheGraph from './d3CacheGraph';
import FlightData from './flightData';
import { connect } from 'react-redux';


class ActiveDestination extends React.Component {
	
	render() {
		return(	
			<div className='active-photo-container' style={{'backgroundImage': 'url(' + this.props.next_image_url + ')'}}>
				<div className='intro'>
					<h3>{this.props.city_name + ', ' + this.props.country}</h3>
					<p> {this.props.intro}</p>
				</div>
				<div className='flight-details'>
					<p>{'Leaving on ' + this.props.bookingDetails.outboundDate.slice(0,10) + ' and returning on ' + this.props.bookingDetails.inboundDate.slice(0,10)}</p>
					<h3>{this.props.bookingDetails.price}</h3>
					<p>{Math.round((Date.now() - new Date(this.props.bookingDetails.created_at))/(60*60*1000)) + ' hours ago'}</p>
					<a className='btn btn-primary' href={this.props.bookingDetails.deepLink} target='_blank'>BUY NOW</a>
				</div>
				<FlightData />
			</div>
		)
	}
}

export default ActiveDestination;
