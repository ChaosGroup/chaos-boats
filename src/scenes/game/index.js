import Phaser from 'phaser';

import Ship from './ship';

const CANVAS_SIZE = 960;
const TILE_SIZE = 64;
const MAP_SIZE = 30;

const SCALE = CANVAS_SIZE / (MAP_SIZE * TILE_SIZE);

export default class ChaosShipsScene extends Phaser.Scene {
	ships;

	constructor() {
		super('chaos-ships');
	}

	preload() {
		this.load.image('tiles', 'assets/tiles_sheet.png');
		this.load.tilemapTiledJSON('arena-map', 'assets/arena_30x30.json');
		this.load.atlas('ship', 'assets/ships_sheet.png', 'assets/ships_sheet.json');
	}

	create() {
		Ship.createAnimations(this.anims);

		this.ships = this.physics.add.group({
			classType: Ship,
			createCallback: ship => ship.create(),
			collideWorldBounds: true,
			allowDrag: true,
			allowRotation: true,
			bounceX: 0.3,
			bounceY: 0.3,
			dragX: 30,
			dragY: 30,
			angularDrag: 30,
		});
		this.physics.add.collider(this.ships, undefined, Ship.shipCollide);

		const tilemap = this.make.tilemap({ key: 'arena-map' });
		tilemap.addTilesetImage('pirates', 'tiles');
		tilemap.layers.forEach((_layer, i) => {
			const layer = tilemap.createStaticLayer(i, 'pirates', 0, 0);
			layer.setCollisionFromCollisionGroup();
			layer.setDepth(i);
			layer.setScale(SCALE);

			this.physics.add.collider(layer, this.ships, Ship.shoreCollide);
		});

		const spawnBounds = Phaser.Geom.Rectangle.Inflate(
			Phaser.Geom.Rectangle.Clone(this.physics.world.bounds),
			-100,
			-100
		);
		for (let i = 1; i <= 6; i++) {
			const pos = Phaser.Geom.Rectangle.Random(spawnBounds);
			this.ships.get(pos.x, pos.y, 'ship', `ship_${i}`);
		}
	}

	update() {}
}
