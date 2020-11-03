import Phaser from 'phaser';

import Ship, {
	MAX_SPEED,
	SPEED_STEPS,
	FIRE_SECTORS,
	TEXTURES_MAP as SHIP_TEXTURES_MAP,
} from './ship';
import { MAX_FIRE_DISTANCE } from './cannonball';

const FIRE_SECTOR_STEP = (2 * Math.PI) / FIRE_SECTORS;

const CANVAS_SIZE = 960;
const TILE_SIZE = 64;
const MAP_SIZE = 30;

const SCALE = CANVAS_SIZE / (MAP_SIZE * TILE_SIZE);

function createSpinningShipCapitan() {
	const speed = Phaser.Math.Between(2, 4); // 0 -> (+5)
	const steer = Phaser.Math.Between(-5, +5); // (-5) <- 0 -> (+5)
	return () => ({
		speed,
		steer,
		fireSector: Phaser.Math.Between(10, 14) % 12 || 12, // 0 -> 12
		state: {},
	});
}

function createMadShipCapitan() {
	return ({ targets }) => {
		const closest = targets.filter(t => t.range < 100).sort((a, b) => a.range - b - range)[0];

		return {
			speed: Phaser.Math.Between(2, 4), // 0 -> (+5)
			steer: Phaser.Math.Between(-5, +5), // (-5) <- 0 -> (+5)
			fireSector: closest?.bearingSector ?? 0,
			state: {},
		};
	};
}

function sittingDuckCapitan({ targets }) {
	return {
		speed: 0,
		steer: 0,
		fireSector: targets[0]?.range < 100 ? targets[0].bearingSector : 0,
		state: {},
	};
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

		// const spawnBounds = Phaser.Geom.Rectangle.Inflate(
		// 	Phaser.Geom.Rectangle.Clone(this.physics.world.bounds),
		// 	-100,
		// 	-100
		// );
		// for (let i = 1; i <= 2; i++) {
		// 	const pos = Phaser.Geom.Rectangle.Random(spawnBounds);
		// 	this.ships.get(pos.x, pos.y, 'ship', `ship_${i + 2}`);
		// }

		const redShip = this.ships.get(200, 200, 'ship', SHIP_TEXTURES_MAP['red-ship']);
		redShip.shipName = 'Black Pearl';
		redShip.texturePrefix = 'red-ship';
		redShip.setRotation(-Math.PI / 4);
		redShip.setShipCapitan(createMadShipCapitan());

		const greenShip = this.ships.get(760, 760, 'ship', SHIP_TEXTURES_MAP['green-ship']);
		greenShip.shipName = 'Dutchman';
		greenShip.texturePrefix = 'green-ship';
		greenShip.setRotation((3 * Math.PI) / 4);
		greenShip.setShipCapitan(createMadShipCapitan());

		this.ships.setDepth(10, 1);

		this.ships.children.iterate(ship => {
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

		const playersTurnEvent = this.time.addEvent({
			delay: 750,
			startAt: 100,
			callback: this.onPlayersTurn,
			callbackScope: this,
			loop: true,
		});

		this.events.on('destroy', () => {
			playersTurnEvent.destroy();
		});
	}

	onPlayersTurn() {
		this.ships.children.iterate(ship => {
			// isolate error domains
			this.time.delayedCall(10, () => {
				const capitan = ship.shipCapitan;
				const inTurnData = this.collectTurnData(ship);
				const outTurnData = capitan(inTurnData);
				ship.onPlayerTurn(outTurnData);
			});
		});
	}

	collectTurnData(ship) {
		const ownShipCenter = ship.body.center;
		const ownShipHeading = ship.body.velocity.normalize();
		// const ownShipSpeed = Math.round((ship.body.velocity.length() * SPEED_STEPS) / MAX_SPEED);

		const targets = this.ships.children
			.getArray()
			.filter(s => s !== ship)
			.map(target => {
				const los = target.body.center.clone().subtract(ownShipCenter);
				const range = Math.round((los.length() * 100) / MAX_FIRE_DISTANCE); // in % of max firing distance
				const heading = target.body.velocity.normalize();
				// const speed = Math.round((target.body.velocity.length() * SPEED_STEPS) / MAX_SPEED);

				const bearing = Math.atan2(ownShipHeading.cross(los), ownShipHeading.dot(los));
				const bearingSector = getSector(bearing);

				const bow = Math.atan2(heading.cross(los.negate()), heading.dot(los.negate()));
				const bowSector = getSector(bow);

				return {
					name: target.shipName,
					health: target.shipHealth,
					range,
					speed: target.shipSpeed, //?
					bearingSector,
					bowSector,
				};
			});

		return {
			tick: this.time.now,
			ownShip: {
				speed: ship.shipSpeed,
				steer: ship.shipSteer,
				fireSector: ship.shipFireSector,
				state: ship.shipState,
			},
			targets,
		};
	}

	update() {}
}

function getSector(angle) {
	return (Math.round(angle / FIRE_SECTOR_STEP) + FIRE_SECTORS) % FIRE_SECTORS || FIRE_SECTORS;
}
