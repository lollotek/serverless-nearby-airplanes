# serverless-nearby-airplanes
serverless for netlify that returns nearby airplanes using opensky data

# use:
send into body the information for long lat and range:
```
{
  "latitude": "45.577441",
  "longitude": "9.0938987",
  "range": "2"
}
```

# sample guide:
https://docs.netlify.com/functions/build-with-javascript/#unbundled-javascript-function-deploys

# debug:
instruction at: https://cli.netlify.com/vscode/#debugging
run `npm run dev-debug`
Open `chrome://inspect` in a cromium browser
