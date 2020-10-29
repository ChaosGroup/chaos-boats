import Phaser from 'phaser';

import { Game } from './scenes';

const CONFIG = {
	title: 'Chaos@JsTalks2020',
	type: Phaser.CANVAS,
	parent: 'phaser-container',
	width: 960,
	height: 960,
	physics: {
		default: 'arcade',
		arcade: { gravity: { x: 0, y: 0 } },
	},
	audio: { noAudio: true },
	scene: [Game],
};

export default new Phaser.Game(CONFIG);
