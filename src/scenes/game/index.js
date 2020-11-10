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
const CANVAS_CENTRE = CANVAS_SIZE / 2;

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
	fontSize: 24,
};
const ROUND_TEXT_STYLE = {
	...HEALTH_TEXT_STYLE,
	fontSize: 80,
	strokeThickness: 8,
};

const TEXTS_DEPTH = 30;

const DRAW_MATCH_POINTS = 1;
const WIN_MATCH_POINTS = 3;

const LEFT_CORNER_POS = { x: 200, y: 200, rotation: (7 / 8) * (2 * Math.PI) };
const RIGHT_CORNER_POS = { x: 760, y: 760, rotation: (3 / 8) * (2 * Math.PI) };

const PLAYER_SHIPS = [
	{
		shipTexture: SHIP_TEXTURES_MAP.redShip,
		flag: { x: 50, y: 45 },
		health: { x: 115, y: 42 },
		score: { x: 50, y: 88 },
		origin: { x: 0, y: 0 }, // left top
	},
	{
		shipTexture: SHIP_TEXTURES_MAP.blueShip,
		flag: { x: CANVAS_SIZE - 50, y: 45 },
		health: { x: CANVAS_SIZE - 115, y: 42 },
		score: { x: CANVAS_SIZE - 50, y: 88 },
		origin: { x: 1, y: 0 }, // right top
	},
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
			layer.setScale(SCALE);

			this.physics.add.collider(layer, this.ships, (ship, tile) => ship.shoreCollide(tile));
		});

		this.createPlayerShips(PLAYERS.JackSparrow, PLAYERS.DavyJones);

		this.timerText = this.add
			.text(CANVAS_CENTRE, 45, '', TIMER_TEXT_STYLE)
			.setOrigin(0.5, 0) // center top align
			.setDepth(TEXTS_DEPTH);

		this.roundText = this.add
			.text(CANVAS_CENTRE, CANVAS_CENTRE, '', ROUND_TEXT_STYLE)
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
			const shipSettings = PLAYER_SHIPS[index];

			const ship = this.ships.get(
				CANVAS_CENTRE,
				CANVAS_CENTRE,
				SHIP_TEXTURES_ATLAS,
				shipSettings.shipTexture.default
			);
			ship.shipTexture = shipSettings.shipTexture;
			ship.shipPlayer = player;

			ship.shipFlagImage = this.add
				.image(
					shipSettings.flag.x,
					shipSettings.flag.y,
					SHIP_TEXTURES_ATLAS,
					shipSettings.shipTexture.flag
				)
				.setOrigin(shipSettings.origin.x, shipSettings.origin.y)
				.setScale(0.8)
				.setDepth(TEXTS_DEPTH);

			ship.shipHealthText = this.add
				.text(shipSettings.health.x, shipSettings.health.y, '', HEALTH_TEXT_STYLE)
				.setOrigin(shipSettings.origin.x, shipSettings.origin.y)
				.setDepth(TEXTS_DEPTH);

			ship.shipScoreText = this.add
				.text(shipSettings.score.x, shipSettings.score.y, '', SCORE_TEXT_STYLE)
				.setOrigin(shipSettings.origin.x, shipSettings.origin.y)
				.setDepth(TEXTS_DEPTH);
		});
	}

	roundStart() {
		this.round += 1;
		this.roundStartTime = null;

		this.timerText.setText(this.getTimerText(GAME_TIMER));

		// alternate ship positions between rounds
		// two ships only
		{
			const aPos = this.round % 2 ? LEFT_CORNER_POS : RIGHT_CORNER_POS;
			const bPos = this.round % 2 ? RIGHT_CORNER_POS : LEFT_CORNER_POS;

			const [aShip, bShip] = this.ships.children.entries;

			aShip.setPosition(aPos.x, aPos.y).setRotation(aPos.rotation);
			bShip.setPosition(bPos.x, bPos.y).setRotation(bPos.rotation);
		}

		this.ships.children.iterate(s => {
			s.roundReset();
			s.updateTexts();
			s.enableBody(true, s.x, s.y, true, true);
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
			roundText = `Round ${this.round}/${GAME_ROUNDS}\No Winner`;
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
		const opponents = this.ships.children.entries.map(s => s.shipPlayer.name).join(' vs. ');
		const result = this.ships.children.entries.map(s => s.matchPoints).join(' - ');
		const time = formatTimer(timer);
		return `${opponents}\n${result} · Round ${this.round}/${GAME_ROUNDS} · Time ${time}`;
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
