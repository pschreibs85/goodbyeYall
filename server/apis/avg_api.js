'use strict'

let router = require('express').Router();
let knex = require('../../db/db');


knex.getAvg = function(originCity, destCity){
	return knex('averages').where('avg_price','>',1).where({
		originCity:originCity,
		destinationCity:destCity
	})
}

module.exports = router;


router.get('/:originCity/:destCity', function(req, res){
	knex.getAvg(req.params.originCity,req.params.destCity)
		.then((array)=>array.map(price=>{ 
			let date = price.outboundYear+'-'+price.outboundMonth
			return {
				price:price.avg_price,
				date: date
			}
		}))
		.then((array)=>res.send(array))

});



// router.get('/d3_cache/:location/:currency/:ISO/:dest/:arrival/:depart_time/:arrival_time', function(req, res){
// 	let skyscanner_endpoint = 'http://partners.api.skyscanner.net/apiservices/browsedates/v1.0';
// 	skyscanner_endpoint+= '/' + req.params.location;
// 	skyscanner_endpoint+= '/' + req.params.currency;
// 	skyscanner_endpoint+= '/' + req.params.ISO;
// 	skyscanner_endpoint+= '/' + req.params.dest;
// 	skyscanner_endpoint+= '/' + req.params.arrival;
// 	skyscanner_endpoint+= '/' + req.params.depart_time;
// 	skyscanner_endpoint+= '/' + req.params.arrival_time;
// 	skyscanner_endpoint+= '?apiKey=' + req.query.apiKey;
// 	requestpromise(skyscanner_endpoint).then(JSON.parse).then(function(resp){
// 		res.json(resp)
// 	})
	
// });
