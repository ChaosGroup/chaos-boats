const path = require('path');
const process = require('process');

const { JSDOM } = require('jsdom');

const WorkerProxy = require('./worker-proxy');
const polyfillObjectURL = require('./object-url');

(async function () {
	console.log('Players rating in Phaser headless mode');

	try {
		const { window } = await JSDOM.fromFile(path.join(__dirname, './dist/headless.html'), {
			runScripts: 'dangerously',
			resources: 'usable',
			pretendToBeVisual: true,
		});

		polyfillObjectURL(window);

		window.Worker = WorkerProxy;

		window.onMatchStart = function (data) {
			console.log('onMatchStart', data);
		};
		window.onRoundStart = function (data) {
			console.log('onRoundStart', data);
		};
		// window.onPlayerTurn = function (data) {
		// 	console.log('onPlayerTurn', data);
		// };
		window.onShipHit = function (data) {
			console.log('onShipHit', data);
		};
		window.onTimerOut = function (data) {
			console.log('onTimerOut', data);
		};
		window.onRoundEnd = function (data) {
			console.log('onRoundEnd', data);
		};
		window.onMatchEnd = function (data) {
			console.log('onMatchEnd', data);

			// bye now
			window.close();
			process.exit(); // HACK: ??
		};
	} catch (error) {
		console.error(error);
		console.log('Exiting');
	}
})();
