import Phaser from 'phaser';

import Ship, {
	getSector,
	TEXTURES_MAP as SHIP_TEXTURES_MAP,
	TEXTURE_ATLAS as SHIP_TEXTURES_ATLAS,
} from './ship';
import Cannonball, { MAX_FIRE_DISTANCE } from './cannonball';

import PLAYERS from '../../players';

const CANVAS_SIZE = 960;
const TILE_SIZE = 64;
const MAP_SIZE = 30;

const SCALE = CANVAS_SIZE / (MAP_SIZE * TILE_SIZE);

function createPlayerWorker(player) {
	const worker = new Worker(player.worker);
	return sceneTurnData => {
		return new Promise(resolve => {
			worker.onmessage = ({ data: playerTurnData }) => resolve(playerTurnData);
			worker.postMessage(sceneTurnData);
		});
	};
}

const SCORE_TEXT_STYLE = {
	fontFamily: 'Eczar, serif',
	fontSize: 30,
	color: '#ffffff',
	stroke: '#6c8587',
	strokeThickness: 4,
};

const TIMER = 3 * 6e4; // 3 min

function formatTimer(remaining) {
	const totalSeconds = Math.floor(remaining / 1e3);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = Math.floor(totalSeconds % 60);
	return `${minutes.toFixed(0).padStart(2, '0')} : ${seconds.toFixed(0).padStart(2, '0')}`;
}

export default class ChaosShipsScene extends Phaser.Scene {
	ships;
	startTime;

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

		this.createTwoShipsBattle();

		this.ships.setDepth(10, 1);
		this.ships.children.iterate(ship => {
			this.physics.add.collider(
				this.ships.children.getArray().filter(s => s !== ship),
				ship.cannonballs,
				(ship, ball) => {
					ball.shipHit(ship);
					ship.takeBallDamage();

					ship.shipScoreText.setText(`${ship.shipHealth}`);
				}
			);
		});

		Cannonball.DieOnWorldBounds(this);

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

		// timer
		this.timerText = this.add
			.text(480, 75, formatTimer(TIMER), SCORE_TEXT_STYLE)
			.setOrigin(0.5, 0) // center align
			.setDepth(30);
	}

	// createAllShipsBatlle() {
	// 	const spawnBounds = Phaser.Geom.Rectangle.Inflate(
	// 		Phaser.Geom.Rectangle.Clone(this.physics.world.bounds),
	// 		-100,
	// 		-100
	// 	);
	// 	[
	// 		SHIP_TEXTURES_MAP.whiteShip,
	// 		SHIP_TEXTURES_MAP.grayShip,
	// 		SHIP_TEXTURES_MAP.redShip,
	// 		SHIP_TEXTURES_MAP.greenShip,
	// 		SHIP_TEXTURES_MAP.blueShip,
	// 		SHIP_TEXTURES_MAP.yellowShip,
	// 	].forEach((shipTexture, i) => {
	// 		const pos = Phaser.Geom.Rectangle.Random(spawnBounds);
	// 		const ship = this.ships.get(pos.x, pos.y, SHIP_TEXTURES_ATLAS, shipTexture.default);
	// 		ship.shipTexture = shipTexture;
	// 		ship.shipPlayer = createCapitanJackSparrow();
	// 		ship.setRotation((i * Math.PI) / 4);
	// 	});
	// }

	createTwoShipsBattle() {
		// Red Ship
		{
			this.redShip = this.ships
				.get(200, 200, SHIP_TEXTURES_ATLAS, SHIP_TEXTURES_MAP.redShip.default)
				.setRotation((7 / 8) * (2 * Math.PI));
			this.redShip.shipTexture = SHIP_TEXTURES_MAP.redShip;
			this.redShip.shipPlayer = PLAYERS.JackSparrow;

			this.redShip.shipScoreText = this.add
				.text(110, 50, this.redShip.shipHealth, SCORE_TEXT_STYLE)
				.setOrigin(0, 0) // left align
				.setDepth(30);
			this.redShip.shipScoreFlag = this.add
				.image(75, 70, SHIP_TEXTURES_ATLAS, SHIP_TEXTURES_MAP.redShip.flag)
				.setScale(0.8)
				.setDepth(30);
		}

		// Blue Ship
		{
			this.blueShip = this.ships
				.get(760, 760, SHIP_TEXTURES_ATLAS, SHIP_TEXTURES_MAP.blueShip.default)
				.setRotation((3 / 8) * (2 * Math.PI));
			this.blueShip.shipTexture = SHIP_TEXTURES_MAP.blueShip;
			this.blueShip.shipPlayer = PLAYERS.FiringDummy;

			this.blueShip.shipScoreText = this.add
				.text(850, 50, this.blueShip.shipHealth, SCORE_TEXT_STYLE)
				.setOrigin(1, 0) // right align
				.setDepth(30);
			this.blueShip.shipScoreFlag = this.add
				.image(885, 70, SHIP_TEXTURES_ATLAS, SHIP_TEXTURES_MAP.blueShip.flag)
				.setScale(0.8)
				.setDepth(30);
		}

		// opponents banner
		this.opponentsText = this.add
			.text(
				480,
				40,
				`${this.redShip.shipPlayer.name} vs ${this.blueShip.shipPlayer.name}`,
				SCORE_TEXT_STYLE
			)
			.setOrigin(0.5, 0) // center align
			.setDepth(30);
	}

	onPlayersTurn() {
		this.opponentsText.updateText();

		this.ships.children.iterate(ship => {
			ship.shipScoreText.updateText();
			if (ship.shipHealth > 0 && ship.shipPlayer) {
				if (!ship.shipPlayerWorker) {
					ship.shipPlayerWorker = createPlayerWorker(ship.shipPlayer);
				}
				const sceneTurnData = this.collectTurnData(ship);
				const playerTurnPromise = ship.shipPlayerWorker(sceneTurnData);
				const timeoutPromise = new Promise(resolve =>
					this.time.delayedCall(200, () => resolve('TIMEOUT'))
				);
				Promise.race([playerTurnPromise, timeoutPromise])
					.then(playerTurnData => {
						if (playerTurnData === 'TIMEOUT') {
							console.log(`Timeout waiting for ${ship.shipPlayer.name} turn!`);
							return;
						}

						if (playerTurnData) {
							ship.onPlayerTurn(playerTurnData);
						}
					})
					.catch(error => {
						console.log(`Error with ${ship.shipPlayer.name} turn!`, error);
					});
			}
		});
	}

	collectTurnData(ownShip) {
		const ownShipCenter = ownShip.body.center.clone();
		const ownShipHeading = ownShip.getShipHeading();

		const targets = this.ships.children
			.getArray()
			.filter(ship => ship !== ownShip && ship.shipHealth > 0)
			.map(target => {
				const los = target.body.center.clone().subtract(ownShipCenter);
				const range = Math.round((los.length() * 100) / MAX_FIRE_DISTANCE); // in % of max firing distance
				const heading = target.getShipHeading();

				const bearing = Math.atan2(ownShipHeading.cross(los), ownShipHeading.dot(los));
				const bearingSector = getSector(bearing);

				const bow = Math.atan2(heading.cross(los.negate()), heading.dot(los.negate()));
				const bowSector = getSector(bow);

				return {
					name: target.shipTexture.name,
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
				name: ownShip.shipTexture.name,
				health: ownShip.shipHealth,
				speed: ownShip.shipSpeed,
				rudder: ownShip.shipRudder,
				fireSector: ownShip.shipFireSector,
				blockedSector: ownShip.shipBlockedSector,
				state: ownShip.shipState,
			},
			targets,
		};
	}

	update(now) {
		if (!this.startTime) {
			this.startTime = now;
		}
		const remaining = Math.max(0, TIMER - (now - this.startTime));
		const timer = formatTimer(remaining);
		this.timerText.setText(timer);
	}
}
