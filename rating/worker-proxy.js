const path = require('path');
const { Worker } = require('worker_threads');

class WorkerProxy {
	constructor(file) {
		this.file = file;
		this.workerPath = path.join(__dirname, './dist/', file);

		this.worker = new Worker(this.workerPath, {});

		this.worker.on('message', (...args) => this.onWorkerMessage(...args));
		this.worker.on('error', (...args) => this.onWorkerError(...args));

		this.onmessage = null;
		this.onerror = null;
	}

	postMessage(data) {
		this.worker?.postMessage({ data });
	}

	onWorkerMessage(data) {
		this.onmessage?.({ data });
	}

	onWorkerError(message) {
		this.onerror?.({ message });
	}

	terminate() {
		this.worker?.terminate();
		this.worker = null;
	}
}

module.exports = WorkerProxy;
