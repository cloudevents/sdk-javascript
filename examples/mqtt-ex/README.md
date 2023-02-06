# MQTT Example

The MQTT message protocol are available since v5.3.0

## How To Start

Install and compile:

```bash
npm install
npm run compile
```

Start a MQTT broker using Docker:

```bash
docker run -it -d  -p 1883:1883 eclipse-mosquitto:2.0 mosquitto -c /mosquitto-no-auth.conf
```

Then, start

```bash
npm start
```
