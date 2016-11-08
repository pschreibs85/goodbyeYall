'use strict'

const RequestPromise = require("request-promise");
const PromiseThrottle = require("promise-throttle");
const Knex = require('../db/db');
if (process.env.NODE_ENV!=='production'){
  var SkyscannerKeys = require("../APIKEYS.js");
}

const today = new Date;
const originCities = ["DFWA-sky", "HOUA-sky", "AUS-sky"];
const destinationCities = ['AMMA-sky', 'RIOA-sky', 'ROME-sky', 'DEL-sky', 'CUN-sky', 'BJSA-sky', 'CUZ-sky', 'HRE-sky', 'REYK-sky', 'PHXA-sky', 'SYD-sky', 'MEX-sky', 'LOND-sky', 'BKKT-sky', 'PARI-sky', 'DXBA-sky', 'ISTA-sky', 'SIN-sky', 'SELA-sky', 'LAX-sky', 'CHIA-sky', 'DEN-sky', 'LAS-sky', 'SFO-sky', 'NYCA-sky', 'MIAA-sky', 'TYOA-sky', 'HKG-sky', 'FLR-sky', 'BERL-sky', 'LIM-sky', 'OGG-sky', 'NAN-sky', 'JMK-sky', 'IBZ-sky', 'AUA-sky', 'GCM-sky'];
const promiseThrottle = new PromiseThrottle({
  requestsPerSecond: 1.75,          // up to 10 requests per second 
  promiseImplementation: Promise  // the Promise library you are using 
});
let flightCount = 0;

//
//adds a given number of days to a date
Date.prototype.addDays = function(days) {
  let flightDate = new Date(this.getTime())
  flightDate.setDate(flightDate.getDate() + days);
  return flightDate;
}


//
//POST request to skyscanner to get session key
function getSessionKey(originplace, destinationplace, outbounddate, inbounddate) {
  let options = {
    method: 'POST',
    uri: 'http://partners.api.skyscanner.net/apiservices/pricing/v1.0',
    transform: (body, response, resolveWithFullResponse) => {
      return response.headers.location.split("/").slice(-1)[0];
    },
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json"
    },
    form: {
      apiKey: process.env.SKYSCANNER_API || SkyscannerKeys.SKYSCANNER_API,
      country: "US",
      currency: "USD",
      locale: "en-US",
      originplace: originplace,
      destinationplace: destinationplace,
      outbounddate: outbounddate.toISOString().slice(0,10),
      inbounddate: inbounddate.toISOString().slice(0,10)
    }
  }
  return RequestPromise(options)
}


//
//GET request to skyscanner to get flight info
function pollSession(sessionKey) {
  console.log("pollSession called");
  let options = {
    method: 'GET',
    uri: 'http://partners.api.skyscanner.net/apiservices/pricing/v1.0/' + sessionKey + '?apiKey=' + (process.env.SKYSCANNER_API || SkyscannerKeys.SKYSCANNER_API),
    headers:{
      Accept: "application/json"
    }
  }
  return RequestPromise(options)
}


//
//returs an object with the lowest price for a 10-day round-trip with a given departure date, and a deep link to book
function searchSkyscannerByDate(departureDate, originCity, destinationCity){
  let outboundDate = departureDate;
  let inboundDate = new Date(departureDate.getTime()).addDays(10);

  return getSessionKey(originCity, destinationCity, outboundDate, inboundDate)
    .then( (sessionKey) => {
      console.log("sessionKey:", sessionKey);
      return sessionKey;
    })
    .then(pollSession)
    .then( (resp) => {
      let response = JSON.parse(resp)
      return response.Itineraries
        .map( (val) => {
          return val.PricingOptions
          .map( (ops) => {
            return  {
                      price: ops.Price,
                      originCity: originCity,
                      destinationCity: destinationCity,
                      outboundDate: outboundDate.toISOString().slice(0,10),
                      inboundDate: inboundDate.toISOString().slice(0,10),
                      outboundMonth: outboundDate.toISOString().slice(5,7),
                      outboundYear: outboundDate.toISOString().slice(0,4),
                      deepLink: ops.DeeplinkUrl
                    }
          })
        })
        .reduce( (prev, current) => {
          return prev.concat(current)
        }, [])
        .reduce( (prev, current) => {
          flightCount++;
          return prev.price < current.price ? prev : current
        }, [])
    })
    .then ( (objToInsertIntoDb) => {
      return objToInsertIntoDb
    })
}


//
//generates an array of flight dates for the next year
function generateFlightDates(daysOut){
  let dates = [];
  let daysAdded = daysOut;
  let count = 0;
  while(count < 46){
    dates.push(today.addDays(daysAdded));
    daysAdded += 7;
    count++;
  }
  return dates;
}


//
// Insert flight object into quotes table
Knex.insertQuotesIntoDb = function(flightObj) {
  console.log("flightCount:", flightCount);
  console.log("insertingQuote:", flightObj);
  return flightObj !== [] ? Knex('quotes').insert(flightObj) : undefined
}


//
//generates argments array for searchSkyscannerByDate function
function generateArgumentsArray() {  
  let departureDates = generateFlightDates(11);
  let results = [];
  originCities.forEach( (city) => {
    destinationCities.forEach( (dest) => {
      departureDates.forEach( (date) => {
        results.push([date, city, dest])
      })
    })
  })
  return results
}


//
//starts the chain that handles all of the functions which gets skyscanner to cache data
function masterDataGenerator(){
  let theMasterArray = generateArgumentsArray()
    .map( (infoArray) => {
      return promiseThrottle.add(searchSkyscannerByDate.bind(this, ...infoArray))
    })
  Promise.all(theMasterArray)
}

//
//reruns all api calls to skyscanner and inserts results into db
function secondRoundInsertQuotes (){
  flightCount = 0;
  let theMasterArray = generateArgumentsArray()
    .map( (infoArray) => {
      return promiseThrottle
        .add(searchSkyscannerByDate.bind(this, ...infoArray))
    })
  Promise.all(theMasterArray
    .map( (promiseFromSkyscanner) => {
      return promiseFromSkyscanner
        .then(Knex.insertQuotesIntoDb)
    })
  )
  .then(Knex.closeDb)
}


masterDataGenerator()
setTimeout(secondRoundInsertQuotes, 3200000)

// secondRoundInsertQuotes();



