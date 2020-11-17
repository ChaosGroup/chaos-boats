## Players Workers

The header import ensures the communication between Game and the Bo(a)t, it is important for Bo(a)ts rating tests and has to be kept intact.

```
const onGameMessage = (typeof importScripts === 'function'
	? (importScripts('port.js'), self)
	: require('./port')
).port;
```

Every active worker should be registered in `src/players.json`.
