'use strict'

const router = require('express').Router();
const knex = require('../db/db.js');
const RequestPromise = require("request-promise");
const ApiKeys = require('../APIKEYS');

const testNotification = "Austin to Mexico City, Cancun, LA & SF for $204 or less! Cheapest ever on GoodybyeYall.com!";
//length cutoff
// const testNotification = "Wow! We just found round trip tickets from Dallas to Denver, LA, New York, Chicago, Mia"

//
//returns all fb user ids from users table
knex.getAllFacebookIdsFromDb = function() {
	return knex('users').select('fb_id')
}


//
//returns all fb user ids who meet desired preferences
knex.getRelevantFacebookIdsFromDb = function(preferredAirport, preferredPackage) {
	let conditions = {};
	conditions[preferredAirport] = true;
	conditions[preferredPackage] = true;

	return knex('users')
		.select('fb_id')
		.where(conditions)
}


//
//GET reqest to Facebook oauth to get new App Access Token
function getAppAccessToken() {
	let options = {
		method: 'GET',
		uri: 'https://graph.facebook.com/oauth/access_token?client_id=' + ApiKeys.FACEBOOK_API.facebookAuth.clientID + '&client_secret=' + ApiKeys.FACEBOOK_API.facebookAuth.clientSecret + '&grant_type=client_credentials'
	}
	return RequestPromise(options)
}


//
//POST request to Facebook Graph API to send user a Facebook notification
///need to add href as forth param
function sendFbNotification(receipientUserId, appAccessToken, notification) {
	let options = {
		method: 'POST',
		uri: 'https://graph.facebook.com/' + receipientUserId + '/notifications?access_token=' + appAccessToken + '&template=' + notification + '&href=/'
	}
	return RequestPromise(options)
}


//
//Promise chain that will send a Facebook notification to all users
function notifyAllUsers(notification) {
	let accessTokenString;
	getAppAccessToken()
	.then ( (accessToken) => {
		console.log("Successfully grabbed accessToken:", accessToken)
		return accessToken.toString().slice(13);
	})
	.catch( (err) => {
		console.log("Error getting app access_token", err)
	})
	.then( (accessTokenString) => {
		accessTokenString = accessTokenString;
		return knex.getAllFacebookIdsFromDb()
			.map((obj)=> {
				return obj.fb_id
			})
	.catch( (err) => {
		console.log("Error fetching fb_ids from database", err)
	})
	.then( (userIdArray) => {
		return Promise.all(userIdArray
			.map((fb_id)=> {
				return sendFbNotification(fb_id, accessTokenString, notification)
			})
		)
	})
	.then(knex.closeDb)
	})
}


//
//Promise chain that will send a Facebook notification to users who's preferences match conditions
function notifyRelevantUsers(notification, preferredOutboundAirport, preferredPackage){
	let accessTokenString;
	getAppAccessToken()
	.then ( (accessToken) => {
		console.log("Successfully grabbed accessToken:", accessToken)
		return accessToken.toString().slice(13);
	})
	.catch( (err) => {
		console.log("Error getting app access_token", err)
	})
	.then( (accessTokenString) => {
		accessTokenString = accessTokenString;
		return knex.getRelevantFacebookIdsFromDb(preferredOutboundAirport, preferredPackage)
			.map((obj)=> {
				return obj.fb_id
			})
	.catch( (err) => {
		console.log("Error fetching fb_ids from database", err)
	})
	.then( (userIdArray) => {
		return Promise.all(userIdArray
			.map((fb_id)=> {
				return sendFbNotification(fb_id, accessTokenString, notification)
			})
		)
	})
	.catch( (err) => {
		console.log("Error sending facebook notification to relevant user", err)
	})
	.then(knex.closeDb)
	})
}

// notifyAllUsers("Time to say ciao y'all because flights to Rome and Florence are the cheapest we've seen at GoodybyeYall.com")

notifyRelevantUsers(testNotification, 'AUS-sky', 'American Cities')

