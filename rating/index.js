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

function createOnRatePlayers(window) {
	const PLAYER_KEYS = Object.keys(PLAYERS);
	const PLAYER_PAIRS = PLAYER_KEYS.flatMap((keyA, index) =>
		PLAYER_KEYS.slice(index + 1).map(keyB => [PLAYERS[keyA], PLAYERS[keyB]])
	);

	let playerPairsIndex = 0;

	return function onRatePlayers(game) {
		if (playerPairsIndex < PLAYER_PAIRS.length) {
			return PLAYER_PAIRS[playerPairsIndex++];
		}

		// no more pairs
		writePlayerRatings();

		// bye
		game.destroy(true);
		setTimeout(() => {
			window.close();
			setTimeout(() => {
				process.exit();
			}, 100);
		}, 100);
	};
}

function writePlayerRatings() {
	const rating = Object.keys(PLAYERS).reduce(
		(acc, key) => ((acc[key] = PLAYERS[key].matchPoints), acc),
		{}
	);

	console.log();
	console.log('Rating');
	console.log('##########################');
	console.log(rating);
	console.log('##########################');

	fs.writeFileSync(
		path.join(__dirname, '../src/ratings.json'),
		JSON.stringify(rating, undefined, 4)
	);
}

(async function () {
	console.log('Players rating in Phaser headless mode');

	const { window } = await JSDOM.fromFile(path.join(__dirname, './dist/headless.html'), {
		runScripts: 'dangerously',
		resources: 'usable',
		// pretendToBeVisual: true,
	});

	polyfillObjectURL(window);

	window.Worker = WorkerProxy;

	window.onRatePlayers = createOnRatePlayers(window);

	const game = await new Promise(
		resolve =>
			(window.onPreloadGame = game => {
				window.onPreloadGame = null;
				resolve(game);
			})
	);

	const scene = game.scene.getScene('game');
	scene.time.timeScale = SPEED_FACTOR;

	scene.events.on('matchStart', data => {
		console.log('matchStart', data);
	});
	scene.events.on('roundStart', data => {
		console.log('roundStart', data);
	});
	// scene.events.on('playerTurn', data => {
	// 	console.log('playerTurn', data);
	// });
	scene.events.on('shipHit', data => {
		console.log('shipHit', data);
	});
	scene.events.on('timerOut', data => {
		console.log('timerOut', data);
	});
	scene.events.on('roundEnd', data => {
		console.log('roundEnd', data);
	});
	scene.events.on('matchEnd', data => {
		console.log('matchEnd', data);

		const { ships } = data;
		ships.forEach(({ player, matchPoints }) => {
			PLAYERS[player].matchPoints += matchPoints;
		});
	});
})();
