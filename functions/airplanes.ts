import fetch from 'node-fetch'
import { Handler } from "@netlify/functions";
import { argMin, validCoordinates, jsonifyPlaneState, openskyLatLonString } from './tools/utils';

const API_ENDPOINT = 'https://opensky-network.org/api'

const handler: Handler = async (event, _) => {
  
  // Only allow POST
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  
  // const {latitude, longitude, range} = event.queryStringParameters
  const { LATITUDE, LOGITUDE, RANGE } = process.env;
  const validCoord = validCoordinates(LATITUDE, LOGITUDE);
  if (!validCoord.valid) {
    return { statusCode: 400, body: validCoord.body };
  }
  const lat = validCoord.body.lat
  const lon = validCoord.body.lon

  console.log(`${API_ENDPOINT}/states/all?${openskyLatLonString(lat, lon, RANGE)}`)

  return fetch(`${API_ENDPOINT}/states/all?${openskyLatLonString(lat, lon, RANGE)}`)
    .then(response => response.json())
    .then((data: {states:Array<Array<string | number | boolean>>}) => {
      let states = data.states;
      const dist = (state) => Math.sqrt((state[5]-lon)**2 + (state[6]-lat)**2);
              
      // Find nearest plane in array
      const nearest = states[argMin(states, dist)];
      // Convert State array to JSON
      const planeJsonData = jsonifyPlaneState(nearest);
      const body = JSON.stringify({callsign: planeJsonData.callsign});
      console.log('response', body);
      return  { statusCode: 200, body: body};
    })
    .catch(err => {
        return  {
          statusCode: err.statusCode || 500,
          body: JSON.stringify({error: err.message})
        };
    });
}

export { handler };