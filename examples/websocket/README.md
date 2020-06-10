# WebSocket Example

This example shows how simple it is to use CloudEvents over a websocket
connection. The code here shows backend communication from two server
side processes, and also between a browser and a server process.

## Running the Example

This simple project consists of a server and a client. The server receives
`CloudEvents` from the client over a local websocket connection.


To get started, first install dependencies.

```sh
npm install
```

### Server
The server opens a websocket and waits for incoming connections. It expects that any
messages it receives will be a CloudEvent. When received, it reads the data field,
expecting a zip code. It then fetches the current weather for that zip code and
responds with a CloudEvent containing the body of the Weather API response as the
event data.

You will need to change one line in the `server.js` file and provide your Open
Weather API key.

To start the server, run `node server.js`.

### Client
Upon start, the client prompts a user for a zip code, then sends a CloudEvent over
a websocket to the server with the provided zip code as the event data. The server
fetches the current weather for that zip code and returns it as a CloudEvent. The
client extracts the data and prints the current weather to the console.

To start the client, run `node client.js`

### Browser
Open the [`index.html`]('./index.html') file in your browser and provide a zip
code in the provided form field. The browser will send the zip code in the data
field of a CloudEvent over a websocket. When it receives a response from the server
it prints the weather, or an error message, to the screen.

To terminate the client or server, type CTL-C.
