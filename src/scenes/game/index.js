import Phaser from 'phaser';

import Ship, {
	getSector,
	TEXTURES_MAP as SHIP_TEXTURES_MAP,
	TEXTURE_ATLAS as SHIP_TEXTURES_ATLAS,
} from './ship';
import Cannonball, { MAX_FIRE_DISTANCE } from './cannonball';

import TextButton from '/components/text-button';

const CANVAS_SIZE = 960;
const TILE_SIZE = 64;
const MAP_SIZE = 30;
const TILE_SCALE = CANVAS_SIZE / (MAP_SIZE * TILE_SIZE);
const HALF_CANVAS_SIZE = CANVAS_SIZE / 2;

// headless rate players run
const HEADLESS_RATING = typeof window.onRatePlayers === 'function';

const GAME_ROUNDS = HEADLESS_RATING ? 6 : 3;
const GAME_TIMER = HEADLESS_RATING ? 1 * 6e4 : 3 * 6e4; // min

const PLAYERS_TURN_STEP = 300;
const PLAYERS_TURN_TIMEOUT = 200;

const BASE_TEXT_STYLE = {
	fontFamily: 'Eczar, serif',
	fontSize: 32,
	color: '#ffffff',
	stroke: '#6c8587',
	strokeThickness: 4,
	align: 'center',
};
const SCORE_TEXT_STYLE = {
	...BASE_TEXT_STYLE,
	fontSize: 24,
};
const TIMER_TEXT_STYLE = {
	...BASE_TEXT_STYLE,
	fontSize: 26,
};
const ROUND_TEXT_STYLE = {
	...BASE_TEXT_STYLE,
	fontSize: 70,
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

const STOP_TURN_DATA = {
	speed: 0,
	rudder: 0,
	fireSector: 0,
};

// simplified web worker to promise wrapper
// no message matching and call synchronization
class PlayerWorker {
	constructor(player) {
		this.worker = new Worker(player.worker);
	}

	call(sceneTurnData) {
		if (!this.worker) {
			return Promise.reject('destroyed');
		}

		return new Promise((resolve, reject) => {
			this.worker.onmessage = ({ data: playerTurnData }) => resolve(playerTurnData);
			this.worker.onerror = ({ message }) => reject(message);
			this.worker.postMessage(sceneTurnData);
		});
	}

	destroy() {
		if (this.worker) {
			this.worker.terminate();
			this.worker = null;
		}
	}
}

function formatTimer(remaining) {
	const totalSeconds = Math.floor(remaining / 1e3);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = Math.floor(totalSeconds % 60);
	return `${minutes.toFixed(0).padStart(2, '0')}:${seconds.toFixed(0).padStart(2, '0')}`;
}

export default class GameScene extends Phaser.Scene {
	constructor() {
		super('game');
	}

	create(data) {
		this.ships = this.physics.add.group(Ship.GroupConfig);

		this.physics.add.collider(this.ships, undefined, (ship1, ship2) => {
			ship1.shipCollide(ship2);
			ship2.shipCollide(ship1);
		});

		const tilemap = this.make.tilemap({ key: 'arena-map' });
		tilemap.addTilesetImage('pirates', 'tiles');
		tilemap.layers.forEach((__, layerIndex) => {
			const layer = tilemap
				.createStaticLayer(layerIndex, 'pirates', 0, 0)
				.setCollisionFromCollisionGroup()
				.setDepth(layerIndex)
				.setScale(TILE_SCALE);

			this.physics.add.collider(layer, this.ships, (ship, tile) => {
				ship.shoreCollide(tile);
			});
		});

		Cannonball.DieOnWorldBounds(this);

		this.timerText = this.add
			.text(HALF_CANVAS_SIZE, 45, '', TIMER_TEXT_STYLE)
			.setOrigin(0.5, 0) // center top align
			.setDepth(TEXTS_DEPTH);

		this.roundText = this.add
			.text(HALF_CANVAS_SIZE, HALF_CANVAS_SIZE, '', ROUND_TEXT_STYLE)
			.setOrigin(0.5, 0.5) // center center align
			.setDepth(TEXTS_DEPTH);

		this.stopButton = this.add
			.existing(
				new TextButton(this, 50, CANVAS_SIZE - 75, '< Menu >', {
					...BASE_TEXT_STYLE,
					fontSize: 24,
				})
			)
			.setOrigin(0, 0) // left top align
			.setDepth(TEXTS_DEPTH)
			.on('click', () => this.onStopClick());

		this.createPlayers(data);
	}

	createPlayers(data) {
		const players = data?.players ?? [];
		this.createPlayerShips(...players);

		this.ships.children.entries.map(ownShip =>
			this.physics.add.collider(
				this.ships.children.entries.filter(s => s !== ownShip),
				ownShip.cannonballs,
				(target, ball) => this.onShipHit(ownShip, target, ball)
			)
		);

		this.ships.setDepth(10, 1);

		this.events.emit('matchStart', {
			ships: this.ships.children.entries.map(s => ({
				player: s.shipPlayer.key,
			})),
			tick: this.time.now,
		});

		this.round = 0;
		this.roundStartTime = null;
		this.roundStart();
	}

	createPlayerShips(...players) {
		players
			.slice(0, PLAYER_SHIPS.length)
			.filter(Boolean)
			.forEach((player, index) => {
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
					.text(
						index % 2 ? CANVAS_SIZE - 50 : 50,
						top + 42,
						player.name,
						SCORE_TEXT_STYLE
					)
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
					.text(index % 2 ? CANVAS_SIZE - 115 : 115, top + 75, '', BASE_TEXT_STYLE)
					.setOrigin(...origin)
					.setDepth(TEXTS_DEPTH);

				ship.shipScoreText = this.add
					.text(index % 2 ? CANVAS_SIZE - 50 : 50, top + 118, '', SCORE_TEXT_STYLE)
					.setOrigin(...origin)
					.setDepth(TEXTS_DEPTH);
			});
	}

	stop() {
		if (this.playersTurnEvent) {
			this.playersTurnEvent.destroy();
			this.playersTurnEvent = null;
		}

		this.ships.children.entries.forEach(ship => {
			ship.shipPlayerWorker.destroy();
			ship.stop();
		});
	}

	onStopClick() {
		this.stop();

		const players = this.scene.settings.data?.players ?? [];
		this.scene.start('menu', { players });
	}

	onShipHit(ownShip, target, ball) {
		ball.shipHit();

		ownShip.registerBallScore();
		target.takeBallDamage();

		ownShip.setTexts();

		this.events.emit('shipHit', {
			player: target.shipPlayer.key,
			health: target.shipHealth,
			score: target.shipScore,
			scored: {
				player: ownShip.shipPlayer.key,
				health: ownShip.shipHealth,
				score: ownShip.shipScore,
			},
			tick: this.time.now,
		});

		const shipsAlive = this.ships.children.entries.filter(s => s.shipHealth > 0);
		if (shipsAlive.length <= 1) {
			this.roundEnd();
		}
	}

	roundStart() {
		this.round += 1;
		this.roundStartTime = null;

		this.timerText.setText(this.getTimerText(GAME_TIMER));

		const ships = [...this.ships.children.entries];

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
			ship.setTexts();
			ship.enableBody(true, ship.x, ship.y, true, true);
		});

		this.roundText.setText(`${this.round}`).setActive(true).setVisible(true);
		this.time.delayedCall(2000, () => {
			this.roundText.setActive(false).setVisible(false);
		});

		this.events.emit('roundStart', {
			round: this.round,
			ships: this.ships.children.entries.map(s => ({
				player: s.shipPlayer.key,
				matchPoints: s.matchPoints,
			})),
			tick: this.time.now,
		});

		this.playersTurnEvent = this.time.addEvent({
			delay: PLAYERS_TURN_STEP,
			startAt: 10,
			callback: this.onPlayersTurn,
			callbackScope: this,
			loop: true,
		});
	}

	stopPlay() {
		if (this.playersTurnEvent) {
			this.playersTurnEvent.destroy();
			this.playersTurnEvent = null;
		}

		this.ships.children.entries.forEach(s => {
			s.setTexts();
			s.stop(false);
		});

		if (this.roundStartTime !== null) {
			const remaining = Math.max(0, GAME_TIMER - (this.time.now - this.roundStartTime));
			this.timerText.setText(this.getTimerText(remaining));
			this.roundStartTime = null;
		}
	}

	roundEnd() {
		this.stopPlay();

		this.time.delayedCall(500, () => {
			const shipsAlive = this.ships.children.entries
				.filter(s => s.shipHealth > 0)
				.sort((a, b) => b.shipScore - a.shipScore);

			const winner = shipsAlive[0];
			let roundText;
			if (shipsAlive.length > 1) {
				const equals = shipsAlive.filter(s => s.shipScore === winner.shipScore);
				if (equals.length > 1) {
					equals
						.filter(s => s.shipScore) // award only if scored
						.forEach(s => s.registerMatchPoints(DRAW_MATCH_POINTS));
					roundText = [`Round ${this.round}/${GAME_ROUNDS}`, 'Draw Round'].join('\n');
				} else {
					winner.registerMatchPoints(WIN_MATCH_POINTS);
					roundText = [`Round ${this.round}/${GAME_ROUNDS}`, winner.shipPlayer.name].join(
						'\n'
					);
				}
			} else if (shipsAlive.length === 1) {
				// award in full only if scored
				winner.registerMatchPoints(winner.shipScore ? WIN_MATCH_POINTS : DRAW_MATCH_POINTS);
				roundText = [`Round ${this.round}/${GAME_ROUNDS}`, winner.shipPlayer.name].join(
					'\n'
				);
			} else {
				roundText = [`Round ${this.round}/${GAME_ROUNDS}`, 'No Winner'].join('\n');
			}
			this.roundText.setText(roundText).setActive(true).setVisible(true);
			this.timerText.setText(this.getTimerText(0));

			this.events.emit('roundEnd', {
				round: this.round,
				ships: this.ships.children.entries.map(s => ({
					player: s.shipPlayer.key,
					health: s.shipHealth,
					score: s.shipScore,
					matchPoints: s.matchPoints,
				})),
				tick: this.time.now,
			});

			this.time.delayedCall(2000, () => {
				this.roundText.setActive(false).setVisible(false);

				if (this.round < GAME_ROUNDS) {
					this.roundStart();
				} else {
					this.matchEnd();
				}
			});
		});
	}

	matchEnd() {
		this.ships.children.entries.forEach(s => {
			s.setTexts();
			s.stop();
		});

		const result = this.ships.children.entries.map(s => s.matchPoints).join(' - ');
		const [winner, ...rest] = [...this.ships.children.entries].sort(
			(a, b) => b.matchPoints - a.matchPoints
		);
		const equals = rest.filter(s => s.matchPoints === winner.matchPoints);

		const winnerText =
			equals.length > 0
				? ['Draw Battle', result].join('\n')
				: ['Battle Won by', winner.shipPlayer.name, result].join('\n');
		this.roundText.setText(winnerText).setActive(true).setVisible(true);

		this.events.emit('matchEnd', {
			ships: this.ships.children.entries.map(s => ({
				player: s.shipPlayer.key,
				matchPoints: s.matchPoints,
			})),
			tick: this.time.now,
		});

		// headless rate players run
		if (HEADLESS_RATING) {
			this.scene.start('preload');
		}
	}

	onPlayersTurn() {
		if (this.roundStartTime === null) {
			this.roundStartTime = this.time.now;
		}

		this.ships.children.entries.forEach(ship => {
			if (ship.shipHealth > 0 && ship.shipPlayer) {
				if (!ship.shipPlayerWorker) {
					ship.shipPlayerWorker = new PlayerWorker(ship.shipPlayer);
				}
				const sceneTurnData = this.collectTurnData(ship);
				const playerTurnPromise = ship.shipPlayerWorker.call(sceneTurnData);
				const timeoutPromise = new Promise(resolve =>
					this.time.delayedCall(PLAYERS_TURN_TIMEOUT, () => resolve('TIMEOUT'))
				);
				Promise.race([playerTurnPromise, timeoutPromise])
					.then(
						playerTurnData => {
							if (playerTurnData === 'TIMEOUT') {
								console.log(`Timeout waiting for ${ship.shipPlayer.name} turn!`);
								return null;
							}

							return { ...STOP_TURN_DATA, ...playerTurnData };
						},
						error => {
							console.log(
								`Error with ${ship.shipPlayer.name} turn, sending Stop command!`,
								error
							);

							return STOP_TURN_DATA;
						}
					)
					.then(playerTurnData => {
						if (playerTurnData) {
							ship.onPlayerTurn(playerTurnData);

							this.events.emit('playerTurn', {
								player: ship.shipPlayer.key,
								sceneTurnData,
								playerTurnData,
								tick: this.time.now,
							});
						}
					})
					.catch(error => {
						console.log(`Error executing ${ship.shipPlayer.name} turn!`, error);
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
					health: target.shipHealth,
					score: target.shipScore,
					speed: target.shipSpeed,
					range,
					bearingSector,
					bowSector,
				};
			});

		return {
			tick: this.time.now,
			ownShip: {
				health: ownShip.shipHealth,
				score: ownShip.shipScore,
				speed: ownShip.shipSpeed,
				rudder: ownShip.shipRudder,
				fireSector: ownShip.shipFireSector,
				blockedSector: ownShip.shipBlockedSector,
			},
			targets,
		};
	}

	getTimerText(timer) {
		const result = this.ships.children.entries.map(s => s.matchPoints).join(' - ');
		const time = formatTimer(timer);
		return [`Round ${this.round}/${GAME_ROUNDS} · Time ${time}`, result].join('\n');
	}

	update(now) {
		this.ships.children.entries.forEach(s => s.setTexts());

		if (this.roundStartTime !== null) {
			const remaining = Math.max(0, GAME_TIMER - (now - this.roundStartTime));
			this.timerText.setText(this.getTimerText(remaining));

			if (remaining <= 0) {
				this.roundEnd();

				this.events.emit('timerOut', {
					ships: this.ships.children.entries.map(s => ({
						player: s.shipPlayer.key,
						health: s.shipHealth,
						score: s.shipScore,
					})),
					tick: this.time.now,
				});
			}
		}
	}
}
