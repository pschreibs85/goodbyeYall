'use strict'

const knex = require('../db/db.js');
// calculate the cheapest ever price by route 

// first go thru the quotes table and grab the cheapest price by route, ignore outbound and inbound date

// in the returned array, do a .map (function(route))
	// get the origin and dest city from the dt (cheapest_route_ever)
	// compare the two obj
	// if the new price is cheaper, update the cheapest_route_ever row (by id)

knex.getCheapestRouteInQuotes = function(){
	// look into the quotes datatable and grab the cheapest routes by origin/dest
	return knex('quotes').select('originCity','destinationCity').min('price as cheapest_price').groupBy('originCity', 'destinationCity')
}

knex.insertCheapestRoute = function(obj){
	//obj represent the current cheapest route price in the quotes datatable
	//obj format 
  // {originCity: 'DFWA-sky',destinationCity: 'AMMA-sky', min: 813.86 }
 	return knex('cheapest_route_ever').where({
  	originCity: obj.originCity,
  	destinationCity: obj.destinationCity
  })
  .then(function(currentCheapest){
		if (currentCheapest.length===0){
			return knex('cheapest_route_ever').insert(obj)
		}
		else if (currentCheapest.length===1){
			if(obj.cheapest_price < currentCheapest[0].cheapest_price){
				obj.created_at = knex.fn.now();
				return knex('cheapest_route_ever').where('id','=',currentCheapest[0].id).update(obj)
			}
			else{
				return;
			}
		}else{
			throw new Error('line 40 worker/cheapestRouteEver.js There is more than one row of current cheapest route, current cheapest route object ', currentCheapest);
		}
  })
  .catch(function(err){
		console.log('line 44 worker/cheapestRouteEver.js there is an error inserting or updating cheapest_route_ever table, ', err);
  })
}

//
//updates cheapest_route_ever table in db
function cheapestRouteEverWorker() {
	console.log('calculating cheapest_route_ever')
	return knex.getCheapestRouteInQuotes().then(function(data){
		data = data.sort(function(x, y){
			if (x.originCity < y.originCity)return 1
			if (x.originCity > y.originCity)return -1
			if (x.originCity === y.originCity){
				if (x.destinationCity < y.destinationCity)return 1
				if (x.destinationCity > y.destinationCity)return -1
			}
		})
		return data
	})
	.then(function(cheapestQuotes){
		return Promise.all(cheapestQuotes.map(knex.insertCheapestRoute))
	})
}


// cheapestRouteEverWorker()
// 	.then(knex.closeDb)


module.exports = {
	cheapestRouteEverWorker: cheapestRouteEverWorker
};
