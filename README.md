# bedrock-event-log
A [bedrock][] module that can be used to record events of defined types into a MongoDB collection.

## Quick Examples
```
var config = require('bedrock').config;
var eventLog = require('bedrock-event-log').log;

// an eventType property MUST be added for each type of event to be recorded
config['event-log'].eventTypes.MyEvent = {
  index: 'itemCategory', // (optional) specify an event property name to use as an index
  ensureWriteSuccess: true  // when false, database operations are performed without waiting for a callback
};

eventLog.add({
  type: 'MyEvent', // MUST correspond to a defined event type
  date: new Date().toJSON(),
  itemCategory: 'itemCategory1234',
  resource: 'https://example.com/item/12345',
  actor: 'user1234' 
}, callback);
```
## API
### add(event, callback)
`event` properties:
- type: an event type that is defined in the event type config (string)(required)
- date: (iso8601)(required)
- resource: the system resource, could be a URL (string)(optional),
- actor: user to associate with the event (string)(optional)
- customField(s): arbitrary properties can be included in the event.  One custom field may be specified as an index field in the event type config.

[bedrock]: https://github.com/digitalbazaar/bedrock
