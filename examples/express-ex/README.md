# Express Example

## How To Start

```bash
npm start
```

## Spec v1.0


__A Structured One__

> Payload [example](../payload/v1/structured-event-0.json)

```bash
curl -X POST \
     -d'@../payload/v1/structured-event-0.json' \
     -H'Content-Type:application/cloudevents+json' \
     http://localhost:3000/
```

__A Structured One with Extension__

> Payload [example](../payload/v1/structured-event-1.json)

```bash
curl -X POST \
     -d'@../payload/v1/structured-event-1.json' \
     -H'Content-Type:application/cloudevents+json' \
     http://localhost:3000/
```

__A Structured One with Base64 Event Data__

> Payload [example](../payload/v1/structured-event-2.json)

```bash
curl -X POST \
     -d'@../payload/v1/structured-event-2.json' \
     -H'Content-Type:application/cloudevents+json' \
     http://localhost:3000/
```

__A Binary One__

```bash
curl -X POST \
     -d'@../payload/data-0.json' \
     -H'Content-Type:application/json' \
     -H'ce-specversion:1.0' \
     -H'ce-type:com.github.pull.create' \
     -H'ce-source:https://github.com/cloudevents/spec/pull/123' \
     -H'ce-id:45c83279-c8a1-4db6-a703-b3768db93887' \
     -H'ce-time:2019-11-06T11:17:00Z' \
     http://localhost:3000/
```

__A Binary One with Extension__

```bash
curl -X POST \
     -d'@../payload/data-0.json' \
     -H'Content-Type:application/json' \
     -H'ce-specversion:1.0' \
     -H'ce-type:com.github.pull.create' \
     -H'ce-source:https://github.com/cloudevents/spec/pull/123' \
     -H'ce-id:45c83279-c8a1-4db6-a703-b3768db93887' \
     -H'ce-time:2019-11-06T11:17:00Z' \
     -H'ce-my-extension:extension value' \
     http://localhost:3000/
```

__A Binary One with Base 64 Encoding__

```bash
curl -X POST \
     -d'@../payload/data-1.txt' \
     -H'Content-Type:application/json' \
     -H'ce-specversion:1.0' \
     -H'ce-type:com.github.pull.create' \
     -H'ce-source:https://github.com/cloudevents/spec/pull/123' \
     -H'ce-id:45c83279-c8a1-4db6-a703-b3768db93887' \
     -H'ce-time:2019-11-06T11:17:00Z' \
     http://localhost:3000/
```


## Spec v0.3

__A Structured One__

> Payload [example](../payload/v03/structured-event-0.json)

```bash
curl -X POST \
     -d'@../payload/v03/structured-event-0.json' \
     -H'Content-Type:application/cloudevents+json' \
     http://localhost:3000/
```

__A Structured One with Extension__

> Payload [example](../payload/v03/structured-event-1.json)

```bash
curl -X POST \
     -d'@../payload/v03/structured-event-1.json' \
     -H'Content-Type:application/cloudevents+json' \
     http://localhost:3000/
```

__A Binary One__

```bash
curl -X POST \
     -d'@../payload/data-0.json' \
     -H'Content-Type:application/json' \
     -H'ce-specversion:0.3' \
     -H'ce-type:com.github.pull.create' \
     -H'ce-source:https://github.com/cloudevents/spec/pull/123' \
     -H'ce-id:45c83279-c8a1-4db6-a703-b3768db93887' \
     -H'ce-time:2019-06-21T17:31:00Z' \
     http://localhost:3000/
```

__A Binary One with Extension__

```bash
curl -X POST \
     -d'@../payload/data-0.json' \
     -H'Content-Type:application/json' \
     -H'ce-specversion:0.3' \
     -H'ce-type:com.github.pull.create' \
     -H'ce-source:https://github.com/cloudevents/spec/pull/123' \
     -H'ce-id:45c83279-c8a1-4db6-a703-b3768db93887' \
     -H'ce-time:2019-06-21T17:31:00Z' \
     -H'ce-my-extension:extension value' \
     http://localhost:3000/
```

__A Binary One with Base 64 Encoding__

```bash
curl -X POST \
     -d'@../payload/data-1.txt' \
     -H'Content-Type:application/json' \
     -H'ce-specversion:0.3' \
     -H'ce-type:com.github.pull.create' \
     -H'ce-source:https://github.com/cloudevents/spec/pull/123' \
     -H'ce-id:45c83279-c8a1-4db6-a703-b3768db93887' \
     -H'ce-time:2019-06-21T17:31:00Z' \
     -H'ce-datacontentencoding:base64' \
     http://localhost:3000/
```

