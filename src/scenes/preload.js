import Phaser from 'phaser';

import { AUTOSTART, DEFAULT } from '/players';

export default class PreloadScene extends Phaser.Scene {
	constructor() {
		super('preload');
	}

	preload() {
		this.load.image('tiles', 'assets/tiles_sheet.png');
		this.load.tilemapTiledJSON('arena-map', 'assets/arena_30x30.json');
		this.load.atlas('ship', 'assets/ships_sheet.png', 'assets/ships_sheet.json');

		// this.load.image('chaos-logo', 'assets/chaosgroup_logo.png');
	}

	create() {
		// headless rate players run
		if (typeof window.onRatePlayers === 'function') {
			const players = window.onRatePlayers();
			if (players?.length > 0) {
				this.scene.start('game', { players });
			}
			return;
		}

		if (AUTOSTART?.length > 0) {
			this.scene.start('game', { players: AUTOSTART });
		} else {
			this.scene.start('menu', { players: DEFAULT ?? [] });
		}
	}
}
