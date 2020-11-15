const fs = require('fs');
const path = require('path');
const process = require('process');

const { JSDOM } = require('jsdom');

const WorkerProxy = require('./worker-proxy');
const polyfillObjectURL = require('./object-url');

const _PLAYERS = require('../src/players.json');

const SPEED_FACTOR = 3;

// append unique key prop to every player to keep players.json self validating
const PLAYERS = Object.keys(_PLAYERS).reduce(
	(acc, key) => (
		(acc[key] = {
			..._PLAYERS[key],
			key,
			matchPoints: 0,
		}),
		acc
	),
	{}
);

(async function () {
	console.log('Players rating in Phaser headless mode');

	try {
		const { window } = await JSDOM.fromFile(path.join(__dirname, './dist/headless.html'), {
			runScripts: 'dangerously',
			resources: 'usable',
			// pretendToBeVisual: true,
		});

		polyfillObjectURL(window);

		window.Worker = WorkerProxy;

		let playerRatePairsIndex = 0;
		const playerRatePairs = [];
		const playersKeys = Object.keys(PLAYERS);
		for (var i = 0; i < playersKeys.length - 1; i++) {
			for (var j = i; j < playersKeys.length - 1; j++) {
				playerRatePairs.push([PLAYERS[playersKeys[i]], PLAYERS[playersKeys[j + 1]]]);
			}
		}

		window.onRatePlayers = function () {
			if (playerRatePairsIndex < playerRatePairs.length) {
				return playerRatePairs[playerRatePairsIndex++];
			}

			const rating = Object.keys(PLAYERS).reduce(
				(acc, key) => ((acc[key] = PLAYERS[key].matchPoints), acc),
				{}
			);

			console.log();
			console.log('Rating');
			console.log('##########################');
			console.log(rating);
			console.log('##########################');

			try {
				fs.writeFileSync(
					path.join(__dirname, '../src/rating.json'),
					JSON.stringify(rating, undefined, 4)
				);
			} catch (err) {
				console.error(err);
			}

			// bye now
			window.close();
			process.exit(); // HACK: ??
		};

		window.onMatchStart = function (data, scene) {
			scene.time.timeScale = SPEED_FACTOR; // speed up time events

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

			const { ships } = data;
			ships.forEach(({ player, matchPoints }) => {
				PLAYERS[player].matchPoints += matchPoints;
			});
		};
	} catch (error) {
		console.error(error);
		console.log('Exiting');
	}
})();
