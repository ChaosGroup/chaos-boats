import Phaser from 'phaser';

const CANVAS_SIZE = 960;
const TILE_SIZE = 64;
const MAP_SIZE = 30;

export default class ChaosShipsScene extends Phaser.Scene {
	constructor() {
		super('chaos-ships');
	}

	preload() {
		this.load.image('tiles', 'assets/tiles_sheet.png');
		this.load.tilemapTiledJSON('arena-map', 'assets/arena_30x30.json');
	}

	create() {
		const arenaTilemap = this.make.tilemap({ key: 'arena-map' });
		arenaTilemap.addTilesetImage('pirates', 'tiles');
		arenaTilemap.layers.forEach((_layer, i) => {
			const layer = arenaTilemap.createStaticLayer(i, 'pirates', 0, 0);
			layer.setDepth(i);
			layer.setScale(CANVAS_SIZE / (MAP_SIZE * TILE_SIZE));
		});
	}

	update() {}
}
