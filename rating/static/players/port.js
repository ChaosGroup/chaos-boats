// Node.js Worker threads Port
const { parentPort } = require('worker_threads');

module.exports = {
	onMessage(handler) {
		parentPort.on('message', handler);
	},
	postMessage(message) {
		parentPort.postMessage(message);
	},
};
