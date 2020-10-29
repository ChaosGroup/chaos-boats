import Phaser from 'phaser';

import skyImg from './assets/skies/space3.png';
import logoImg from './assets/sprites/phaser3-logo.png';
import redImg from './assets/particles/red.png';

function preload() {
	this.load.image('sky', skyImg);
	this.load.image('logo', logoImg);
	this.load.image('red', redImg);
}

function create() {
	this.add.image(800, 600, 'sky');

	var particles = this.add.particles('red');

	var emitter = particles.createEmitter({
		speed: 100,
		scale: { start: 1, end: 0 },
		blendMode: 'ADD',
	});

	var logo = this.physics.add.image(400, 100, 'logo');

	logo.setVelocity(100, 200);
	logo.setBounce(1, 1);
	logo.setCollideWorldBounds(true);

	emitter.startFollow(logo);
}

const CONFIG = {
	type: Phaser.AUTO,
	width: 800,
	height: 600,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 200 },
		},
	},
	scene: {
		preload: preload,
		create: create,
	},
};

new Phaser.Game(CONFIG);
