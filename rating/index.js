const path = require('path');
const process = require('process');

const { JSDOM } = require('jsdom');

const WorkerProxy = require('./worker-proxy');
const polyfillObjectURL = require('./object-url');

const _PLAYERS = require('../src/players.json');

// append unique key prop to every player to keep players.json self validating
const PLAYERS = Object.keys(_PLAYERS).reduce(
	(acc, key) => ((acc[key] = { ..._PLAYERS[key], key }), acc),
	{}
);

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

		let playerRatePairsIndex = 0;
		const playerRatePairs = [
			[PLAYERS.FiringDummy, PLAYERS.JackSparrow],
			[PLAYERS.FiringDummy, PLAYERS.DavyJones],
			[PLAYERS.FiringDummy, PLAYERS.MovingDummy],
		];

		window.onRatePlayers = function () {
			if (playerRatePairsIndex < playerRatePairs.length) {
				return playerRatePairs[playerRatePairsIndex++];
			}

			// bye now
			window.close();
			process.exit(); // HACK: ??
		};

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
		};
	} catch (error) {
		console.error(error);
		console.log('Exiting');
	}
})();
