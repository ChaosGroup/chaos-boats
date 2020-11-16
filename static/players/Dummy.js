/* eslint-env worker, node */
const onGameMessage = (typeof importScripts === 'function'
	? (importScripts('port.js'), self)
	: require('./port')
).port;

// stay in place
onGameMessage(() => ({
	speed: 0,
	rudder: 0,
}));
