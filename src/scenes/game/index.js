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
const TILE_SCALE = CANVAS_SIZE / (MAP_SIZE * TILE_SIZE);
const HALF_CANVAS_SIZE = CANVAS_SIZE / 2;

const GAME_ROUNDS = 3;
const GAME_TIMER = 3 * 6e4; // 3 min

const HEALTH_TEXT_STYLE = {
	fontFamily: 'Eczar, serif',
	fontSize: 32,
	color: '#ffffff',
	stroke: '#6c8587',
	strokeThickness: 4,
	align: 'center',
};
const SCORE_TEXT_STYLE = {
	...HEALTH_TEXT_STYLE,
	fontSize: 24,
};
const TIMER_TEXT_STYLE = {
	...HEALTH_TEXT_STYLE,
	fontSize: 26,
};
const ROUND_TEXT_STYLE = {
	...HEALTH_TEXT_STYLE,
	fontSize: 80,
	strokeThickness: 8,
};

const TEXTS_DEPTH = 30;

const DRAW_MATCH_POINTS = 1;
const WIN_MATCH_POINTS = 3;

const START_POSITION_RADIUS = (2 / 3) * HALF_CANVAS_SIZE;
const START_POSITION_ANGLE = Math.PI / 4;

const SCORE_VERTICAL_STEP = 135;

const PLAYER_SHIPS = [
	SHIP_TEXTURES_MAP.redShip,
	SHIP_TEXTURES_MAP.blueShip,
	SHIP_TEXTURES_MAP.grayShip,
	SHIP_TEXTURES_MAP.greenShip,
	SHIP_TEXTURES_MAP.whiteShip,
	SHIP_TEXTURES_MAP.yellowShip,
];

function createPlayerWorker(player) {
	const worker = new Worker(player.worker);
	return sceneTurnData => {
		return new Promise(resolve => {
			worker.onmessage = ({ data: playerTurnData }) => resolve(playerTurnData);
			worker.postMessage(sceneTurnData);
		});
	};
}

function formatTimer(remaining) {
	const totalSeconds = Math.floor(remaining / 1e3);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = Math.floor(totalSeconds % 60);
	return `${minutes.toFixed(0).padStart(2, '0')}:${seconds.toFixed(0).padStart(2, '0')}`;
}

export default class ChaosShipsScene extends Phaser.Scene {
	ships;

	round = 0;
	roundStartTime = null;

	timerText;
	roundText;

	playersTurnEvent;

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
			layer.setScale(TILE_SCALE);

			this.physics.add.collider(layer, this.ships, (ship, tile) => ship.shoreCollide(tile));
		});

		this.createPlayerShips(PLAYERS.JackSparrow, PLAYERS.DavyJones);

		this.timerText = this.add
			.text(HALF_CANVAS_SIZE, 45, '', TIMER_TEXT_STYLE)
			.setOrigin(0.5, 0) // center top align
			.setDepth(TEXTS_DEPTH);

		this.roundText = this.add
			.text(HALF_CANVAS_SIZE, HALF_CANVAS_SIZE, '', ROUND_TEXT_STYLE)
			.setOrigin(0.5, 0.5) // center center align
			.setDepth(TEXTS_DEPTH);

		this.ships.setDepth(10, 1);
		this.ships.children.iterate(ownShip => {
			this.physics.add.collider(
				this.ships.children.entries.filter(s => s !== ownShip),
				ownShip.cannonballs,
				(target, ball) => this.onShipHit(ownShip, target, ball)
			);
		});

		Cannonball.DieOnWorldBounds(this);

		this.events.on('destroy', () => {
			if (this.playersTurnEvent) {
				this.playersTurnEvent.destroy();
				this.playersTurnEvent = null;
			}
		});

		this.roundStart();
	}

	onShipHit(ownShip, target, ball) {
		ball.shipHit();

		ownShip.registerBallScore();
		target.takeBallDamage();

		ownShip.updateTexts();

		const shipsAlive = this.ships.children.entries.filter(s => s.shipHealth > 0);
		if (shipsAlive.length <= 1) {
			this.roundStop();
		}
	}

	createPlayerShips(...players) {
		players.forEach((player, index) => {
			const shipTexture = PLAYER_SHIPS[index];
			const origin = index % 2 ? [1, 0] : [0, 0]; // top right/left
			const top = Math.floor(index / 2) * SCORE_VERTICAL_STEP;

			const ship = this.ships.get(
				HALF_CANVAS_SIZE,
				HALF_CANVAS_SIZE,
				SHIP_TEXTURES_ATLAS,
				shipTexture.default
			);
			ship.shipTexture = shipTexture;
			ship.shipPlayer = player;

			ship.shipPlayerText = this.add
				.text(index % 2 ? CANVAS_SIZE - 50 : 50, top + 42, player.name, SCORE_TEXT_STYLE)
				.setOrigin(...origin)
				.setDepth(TEXTS_DEPTH);

			ship.shipFlagImage = this.add
				.image(
					index % 2 ? CANVAS_SIZE - 52 : 52,
					top + 78,
					SHIP_TEXTURES_ATLAS,
					shipTexture.flag
				)
				.setOrigin(...origin)
				.setScale(0.8)
				.setDepth(TEXTS_DEPTH);

			ship.shipHealthText = this.add
				.text(index % 2 ? CANVAS_SIZE - 115 : 115, top + 75, '', HEALTH_TEXT_STYLE)
				.setOrigin(...origin)
				.setDepth(TEXTS_DEPTH);

			ship.shipScoreText = this.add
				.text(index % 2 ? CANVAS_SIZE - 50 : 50, top + 118, '', SCORE_TEXT_STYLE)
				.setOrigin(...origin)
				.setDepth(TEXTS_DEPTH);
		});
	}

	roundStart() {
		this.round += 1;
		this.roundStartTime = null;

		this.timerText.setText(this.getTimerText(GAME_TIMER));

		const ships = this.ships.children.getArray();

		// rotate positions
		let steps = this.round;
		while (--steps) {
			ships.unshift(ships.pop());
		}

		// put ships on a circle heading to the center
		const sector = (2 * Math.PI) / ships.length;
		ships.forEach((ship, index) => {
			const angle = index * sector + START_POSITION_ANGLE;
			const vector = new Phaser.Math.Vector2().setToPolar(angle, START_POSITION_RADIUS);
			ship.setPosition(vector.x + HALF_CANVAS_SIZE, vector.y + HALF_CANVAS_SIZE).setRotation(
				vector.angle() + Math.PI / 2
			);

			ship.roundReset();
			ship.updateTexts();
			ship.enableBody(true, ship.x, ship.y, true, true);
		});

		this.roundText.setText(`${this.round}`).setActive(true).setVisible(true);
		this.time.delayedCall(2000, () => {
			this.roundText.setActive(false).setVisible(false);
		});

		this.playersTurnEvent = this.time.addEvent({
			delay: 500,
			startAt: 10,
			callback: this.onPlayersTurn,
			callbackScope: this,
			loop: true,
		});
	}

	roundStop() {
		if (this.playersTurnEvent) {
			this.playersTurnEvent.destroy();
			this.playersTurnEvent = null;
		}

		this.ships.children.iterate(s => {
			s.updateTexts();
			s.disableBody(true, false);
		});

		const shipsAlive = this.ships.children.entries
			.filter(s => s.shipHealth > 0)
			.sort((a, b) => b.shipScore - a.shipScore);
		const winner = shipsAlive[0];
		let roundText;
		if (shipsAlive.length > 1) {
			const equals = shipsAlive.filter(s => s.shipScore === winner.shipScore);
			if (equals.length > 1) {
				equals.forEach(s => s.registerMatchPoints(DRAW_MATCH_POINTS));
				roundText = `Round ${this.round}/${GAME_ROUNDS}\nDraw Round`;
			} else {
				winner.registerMatchPoints(WIN_MATCH_POINTS);
				roundText = `Round ${this.round}/${GAME_ROUNDS}\n${winner.shipPlayer.name}`;
			}
		} else if (shipsAlive.length === 1) {
			winner.registerMatchPoints(WIN_MATCH_POINTS);
			roundText = `Round ${this.round}/${GAME_ROUNDS}\n${winner.shipPlayer.name}`;
		} else {
			roundText = `Round ${this.round}/${GAME_ROUNDS}\nNo Winner`;
		}
		this.roundText.setText(roundText).setActive(true).setVisible(true);

		if (this.roundStartTime !== null) {
			const remaining = Math.max(0, GAME_TIMER - (this.time.now - this.roundStartTime));
			this.timerText.setText(this.getTimerText(remaining));
			this.roundStartTime = null;
		}

		this.time.delayedCall(2000, () => {
			this.roundText.setActive(false).setVisible(false);

			if (this.round < GAME_ROUNDS) {
				this.roundStart();
			} else {
				this.matchEnd();
			}
		});
	}

	matchEnd() {
		this.ships.children.iterate(s => {
			s.disableBody(true, true);
		});

		const ships = this.ships.children.entries.sort((a, b) => b.matchPoints - a.matchPoints);
		const winner = ships[0];
		const equals = ships.filter(s => s.matchPoints === winner.matchPoints);

		const winnerText =
			equals.length > 1 ? `Draw Game` : `Game Winner\n${winner.shipPlayer.name}`;
		this.roundText.setText(winnerText).setActive(true).setVisible(true);
	}

	onPlayersTurn() {
		if (this.roundStartTime === null) {
			this.roundStartTime = this.time.now;
		}

		this.ships.children.iterate(ship => {
			ship.shipPlayerText.updateText();
			ship.shipHealthText.updateText();
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

		const targets = this.ships.children.entries
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

	getTimerText(timer) {
		const result = this.ships.children.entries.map(s => s.matchPoints).join(' - ');
		const time = formatTimer(timer);
		return `Round ${this.round}/${GAME_ROUNDS} · Time ${time}\n${result}`;
	}

	update(now) {
		this.ships.children.iterate(s => s.updateTexts());

		if (this.roundStartTime !== null) {
			const remaining = Math.max(0, GAME_TIMER - (now - this.roundStartTime));
			this.timerText.setText(this.getTimerText(remaining));

			if (remaining <= 0) {
				this.roundStop();
			}
		}
	}
}
