const { parentPort } = require('worker_threads');
exports.port = cb => parentPort.on('message', ({ data }) => parentPort.postMessage(cb(data)));
