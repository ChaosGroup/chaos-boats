import Phaser from 'phaser';

import Ship from './ship';

const CANVAS_SIZE = 960;
const TILE_SIZE = 64;
const MAP_SIZE = 30;

const SCALE = CANVAS_SIZE / (MAP_SIZE * TILE_SIZE);

function createSpinningShipCapitan() {
	const speed = Phaser.Math.Between(2, 4); // 0 -> (+5)
	const steer = Phaser.Math.Between(-5, +5); // (-5) <- 0 -> (+5)
	return () => ({ speed, steer, fireSector: 12 });
}

function createMadShipCapitan() {
	return () => ({
		speed: Phaser.Math.Between(2, 4), // 0 -> (+5)
		steer: Phaser.Math.Between(-5, +5), // (-5) <- 0 -> (+5)
		fireSector: Phaser.Math.Between(10, 14) % 12 || 12, // 0 -> 12
	});
}

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

		this.physics.add.collider(this.ships, undefined, (ship1, ship2) => {
			ship1.shipCollide(ship2);
			ship2.shipCollide(ship1);
		});

		const tilemap = this.make.tilemap({ key: 'arena-map' });
		tilemap.addTilesetImage('pirates', 'tiles');
		tilemap.layers.forEach((_layer, i) => {
			const layer = tilemap.createStaticLayer(i, 'pirates', 0, 0);
			layer.setCollisionFromCollisionGroup();
			layer.setDepth(i);
			layer.setScale(SCALE);

			this.physics.add.collider(layer, this.ships, (ship, tile) => ship.shoreCollide(tile));
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
		this.ships.setDepth(10, 1);

		this.ships.children.iterate(ship => {
			ship.setShipCapitan(createMadShipCapitan());

			this.physics.add.collider(
				this.ships.children.getArray().filter(s => s !== ship),
				ship.cannonballs,
				(ship, ball) => {
					ball.shipHit(ship);
					ship.takeBallDamage();
				}
			);
		});

		this.physics.world.on('worldbounds', body => {
			body.gameObject.stop?.();
		});
	}

	update() {}
}
