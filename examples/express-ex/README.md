# Express Example

## To Start

```bash
npm start
```

## To Post an Event

__A Structured One__

```bash
curl -X POST \
     -d'@../payload/v02/structured-event-0.json' \
     -H'Content-Type:application/cloudevents+json' \
     http://localhost:3000/
```

__A Binary One__

```bash
curl -X POST \
     -d'@../payload/data-0.json' \
     -H'Content-Type:application/json' \
     -H'ce_specversion:0.2' \
     -H'ce_type:com.github.pull.create' \
     -H'ce_source:https://github.com/cloudevents/spec/pull/123' \
     -H'ce_id:45c83279-c8a1-4db6-a703-b3768db93887' \
     -H'ce_time:2019-06-21T17:31:00Z' \
     http://localhost:3000/
```
__A Batch One__

TODO
