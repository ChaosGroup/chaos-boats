const port =
	typeof importScripts === 'function'
		? (importScripts('port.js'), self._port)
		: require('./port');

port.onMessage(function () {
	// stay in place
	port.postMessage({
		speed: 0,
		rudder: 0,
	});
});
