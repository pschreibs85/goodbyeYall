'use strict'
let knex = require('../../db/db');
//not using this file 

module.exports = knex;

knex.fetchDestinationsFromDb = function(selectedPackage){
	return knex.pullDestinationsByPackage(selectedPackage)
		.then( (data) => {
			console.log(data)
			return data
		})


	///add closeDb function at end
}
// fetchDestinationsFromDb("Seven Wonders of the World");
