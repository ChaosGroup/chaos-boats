// Browser Web Workers Port
self._port = {
	onMessage(handler) {
		self.onmessage = handler;
	},
	postMessage(message) {
		self.postMessage(message);
	},
};
