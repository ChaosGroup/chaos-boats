import Phaser from 'phaser';

import Ship, { TEXTURES_MAP as SHIP_TEXTURES_MAP, getSector } from './ship';
import { MAX_FIRE_DISTANCE } from './cannonball';

const CANVAS_SIZE = 960;
const TILE_SIZE = 64;
const MAP_SIZE = 30;

const SCALE = CANVAS_SIZE / (MAP_SIZE * TILE_SIZE);

function createSpinningShipCapitan() {
	const speed = Phaser.Math.Between(2, 4); // 0 -> (+5)
	const rudder = Phaser.Math.Between(-3, +3); // (-3) <- 0 -> (+3)
	return () => ({
		speed,
		rudder,
		fireSector: Phaser.Math.Between(10, 14) % 12 || 12, // 0 -> 12
		state: {},
	});
}

function createCapitanJackSparrow() {
	return ({ ownShip, targets }) => {
		const closest = targets.filter(t => t.range < 100).sort((a, b) => a.range - b - range)[0];
		const fireSector = closest?.bearingSector ?? 0;

		// 0 -> (+5)
		let speed = Phaser.Math.Between(2, 5);
		if (closest?.range < 30) {
			speed = 5;
		}

		// (-3) <- 0 -> (+3)
		let rudder = Phaser.Math.Between(-2, +2);
		if (ownShip.blockedSector) {
			speed = 5;

			if (ownShip.blockedSector === 12) {
				// pick left or right
				rudder = 3 * Phaser.Math.Between(1, 10) > 3 ? 1 : -1;
			} else if (ownShip.blockedSector >= 9) {
				rudder = 3; // turn right
			} else if (ownShip.blockedSector <= 3) {
				rudder = -3; // turn left
			}
		}

		return {
			speed,
			rudder,
			fireSector,

			state: {
				engaging: closest?.shipName ?? null,
			},
		};
	};
}

function sittingDuckCapitan({ targets }) {
	return {
		speed: 0,
		rudder: 0,
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
		this.ships = this.physics.add.group(Ship.GroupConfig);

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
		redShip.shipPlayer = createCapitanJackSparrow();
		redShip.texturePrefix = 'red-ship';
		redShip.setRotation((-1 * Math.PI) / 4);

		const greenShip = this.ships.get(760, 760, 'ship', SHIP_TEXTURES_MAP['green-ship']);
		greenShip.shipName = 'Dutchman';
		greenShip.shipPlayer = createCapitanJackSparrow();
		greenShip.texturePrefix = 'green-ship';
		greenShip.setRotation((3 * Math.PI) / 4);

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
			delay: 500,
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
				const playerTurn = ship.shipPlayer?.(this.collectTurnData(ship));
				if (playerTurn) {
					ship.onPlayerTurn(playerTurn);
				}
			});
		});
	}

	collectTurnData(ship) {
		const ownShipCenter = ship.body.center.clone();
		const ownShipHeading = ship.body.velocity.clone().normalize();
		// const ownShipSpeed = Math.round((ship.body.velocity.length() * SPEED_STEPS) / MAX_SPEED);

		const targets = this.ships.children
			.getArray()
			.filter(s => s !== ship)
			.map(target => {
				const los = target.body.center.clone().subtract(ownShipCenter);
				const range = Math.round((los.length() * 100) / MAX_FIRE_DISTANCE); // in % of max firing distance
				const heading = target.body.velocity.clone().normalize();
				// const speed = Math.round((target.body.velocity.length() * SPEED_STEPS) / MAX_SPEED);

				const bearing = Math.atan2(ownShipHeading.cross(los), ownShipHeading.dot(los));
				const bearingSector = getSector(bearing);

				const bow = Math.atan2(heading.cross(los.negate()), heading.dot(los.negate()));
				const bowSector = getSector(bow);

				return {
					name: target.shipName,
					health: target.shipHealth,
					range,
					speed: target.shipSpeed,
					bearingSector,
					bowSector,
				};
			});

		return {
			tick: this.time.now,
			ownShip: {
				name: ship.shipName,
				health: ship.shipHealth,
				speed: ship.shipSpeed,
				rudder: ship.shipRudder,
				fireSector: ship.shipFireSector,
				blockedSector: ship.shipBlockedSector,
				state: ship.shipState,
			},
			targets,
		};
	}

	update() {}
}
