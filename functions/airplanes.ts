import { FlightRadar24API } from "flightradarapi";
// import fetch from 'node-fetch'
import { Handler } from "@netlify/functions";
import { argMin, validCoordinates, jsonifyPlaneState, openskyLatLonString } from './tools/utils';

const API_ENDPOINT = 'https://opensky-network.org/api'

const frApi = new FlightRadar24API();

function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRadians = degrees => degrees * (Math.PI / 180);

  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

const handler: Handler = async (event, _) => {
  try{
    const {latitude, longitude, range} = event.queryStringParameters;
    let bounds = frApi.getBoundsByPoint(parseFloat(latitude), parseFloat(longitude), parseFloat(range)  * 1000);
    let flights = await frApi.getFlights(null, bounds);
    
    const flightsOnAir = flights.filter(flight => flight.altitude > 100 );
    const flightsSort = flightsOnAir.map(flight =>( {...flight, dist: haversineDistance(flight.latitude, flight.longitude, latitude, longitude) }));
    const nearFlight = flightsSort.reduce((lowest, flight) => {
      return flight.dist < lowest.dist ? flight : lowest;
    }, flightsSort[0]);

    console.log('RADAR: ', nearFlight);
    if (nearFlight){
      return  { statusCode: 200, body: jsonifyPlaneState.stringify(nearFlight)};
    }else{
      // no airplanes
      return  { statusCode: 204 };
    }
  } catch { (err) => {
    return  {
        statusCode: err.statusCode || 500,
        body: JSON.stringify({error: err.message})
      };
    };
  }
}
/*
const handler: Handler = async (event, _) => {
  
  // Only allow POST
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  
  const {latitude, longitude, range} = event.queryStringParameters;
  const { LATITUDE, LONGITUDE, RANGE } = process.env;

  const paramLatitude = latitude ?? LATITUDE;
  const paramLongitude = longitude ?? LONGITUDE;
  const paramRange = range ?? RANGE;

  console.log('using params: ', paramLatitude, paramLongitude, paramRange);
  const validCoord = validCoordinates(paramLatitude, paramLongitude);
  if (!validCoord.valid) {
    return { statusCode: 400, body: validCoord.body };
  }
  const lat = validCoord.body.lat
  const lon = validCoord.body.lon

  console.log(`${API_ENDPOINT}/states/all?${openskyLatLonString(lat, lon, parseFloat(paramRange))}`)

  return fetch(`${API_ENDPOINT}/states/all?${openskyLatLonString(lat, lon, parseFloat(paramRange))}`)
    .then(response => response.json())
    .then((data: {states:Array<Array<string | number | boolean>>}) => {
      let states = data.states;
      const dist = (state) => Math.sqrt((state[5]-lon)**2 + (state[6]-lat)**2);
      // if i found something..
      if (states && states.length > 0){
        // Find nearest plane in array
        const nearest = states[argMin(states, dist)];
        // Convert State array to JSON
        const planeJsonData = jsonifyPlaneState(nearest);
        const body = JSON.stringify({callsign: planeJsonData.callsign});
        console.log('response', body);
        return  { statusCode: 200, body: body};
      }else{
        // no airplanes
        return  { statusCode: 204 };
      }
    })
    .catch(err => {
        return  {
          statusCode: err.statusCode || 500,
          body: JSON.stringify({error: err.message})
        };
    });
}
*/
export { handler };