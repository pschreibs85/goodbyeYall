'use strict'
import axios from "axios"
import { SET_ACTIVE_DESTINATION } from '../actions/setActiveDestination';
import { FETCH_PACKAGE } from '../actions/fetchPackage'
import { IS_FETCHING } from '../actions/isFetching'


let INITIAL_STATE = { passive: [], active: [], package_name:'', fetching:false};


/**
 * airport reducer that change set the state of destination
 * @param {object} action - { type: {string}, paylaod : {object} }
 */

export default function (state = INITIAL_STATE, action) {
	// console.log('line 17 reducers/reducers_destination.js state is ',state)
	// console.log('line 18 reducers/reducers_destination.js action is',action)
  switch (action.type){
		case SET_ACTIVE_DESTINATION:
			let newState = {};
			let insertIndex;
			let oldActive = state.active.slice()
			newState.package_name = state.package_name;
			newState.fetching = state.fetching;
			newState.active = state.passive.slice().filter((obj, ind) => {if(insertIndex === undefined && obj.id === action.payload){insertIndex = ind}; return obj.id === action.payload})
			newState.passive = state.passive.slice(0, insertIndex).concat(oldActive[0], state.passive.slice(insertIndex+1))
    	return newState
		case FETCH_PACKAGE:
			return { passive: action.payload.data.slice(0,-1), active: action.payload.data.slice(-1), package_name:action.payload.package_name, fetching:action.payload.fetching }
		case IS_FETCHING:
			let FETCHING_newState = {};
			for (let key in state){
				FETCHING_newState[key] = state[key]
			}
			FETCHING_newState['fetching'] = action.payload;
			return FETCHING_newState
		default:
			return state
	}
}