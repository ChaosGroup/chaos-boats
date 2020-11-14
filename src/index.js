import Phaser from 'phaser';

import { Preload, Menu, Game } from '/scenes';

const CONFIG = {
	title: 'Chaos @ js.talks(); 2020',
	type: Phaser.AUTO,
	parent: 'phaser-container',
	width: 960,
	height: 960,
	maxWidth: 960,
	maxHeight: 960,
	backgroundColor: 0xfae8c2,
	physics: {
		default: 'arcade',
		arcade: { gravity: { x: 0, y: 0 }, debug: false },
	},
	audio: { noAudio: true },
	scene: [Preload, Menu, Game],
	scale: {
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
	},
};

export default new Phaser.Game(CONFIG);
