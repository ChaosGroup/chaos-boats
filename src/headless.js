import Phaser from 'phaser';

import { Preload, Game } from '/scenes';

const SPEED_FACTOR = 3;

const CONFIG = {
	title: 'Chaos @ js.talks(); 2020 | Headless',
	type: Phaser.HEADLESS,
	parent: 'phaser-container',
	width: 960,
	height: 960,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { x: 0, y: 0 },
			debug: false,
			fps: SPEED_FACTOR * 30,
			timeScale: 1 / SPEED_FACTOR,
		},
	},
	fps: {
		target: SPEED_FACTOR * 30,
		forceSetTimeOut: true,
	},
	autoFocus: false,
	audio: { noAudio: true },
	scene: [Preload, Game],
};

export default new Phaser.Game(CONFIG);
