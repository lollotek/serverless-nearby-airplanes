import fetch from 'node-fetch'
import { Handler } from "@netlify/functions";
import { argMin, validCoordinates, jsonifyPlaneState, openskyLatLonString } from './tools/utils';

const API_ENDPOINT = 'https://opensky-network.org/api'

const handler: Handler = async (event, _) => {
  
  // Only allow POST
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  
  const {paramLatitude, paramLongitude, paramRange} = event.queryStringParameters;
  const { LATITUDE, LONGITUDE, RANGE } = process.env;

  const latitude = paramLatitude ?? LATITUDE;
  const longitude = paramLongitude ?? LONGITUDE;
  const range = paramRange ?? RANGE;

  console.log('using params: ', latitude, longitude, range);
  const validCoord = validCoordinates(latitude, longitude);
  if (!validCoord.valid) {
    return { statusCode: 400, body: validCoord.body };
  }
  const lat = validCoord.body.lat
  const lon = validCoord.body.lon

  console.log(`${API_ENDPOINT}/states/all?${openskyLatLonString(lat, lon, parseFloat(range))}`)

  return fetch(`${API_ENDPOINT}/states/all?${openskyLatLonString(lat, lon, parseFloat(range))}`)
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

export { handler };