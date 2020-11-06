import Phaser from 'phaser';

import Cannonball, { TEXTURES_MAP as CANNONBALL_TEXTURES_MAP } from './cannonball';

// enum HealthState
// {
// 	IDLE,
// 	DAMAGE_1,
// 	DAMAGE_2,
// 	DEAD
// }

// const BODY_SCALE_W = 0.7;
// const BODY_SCALE_H = 0.8;

export const MAX_SPEED = 350;
export const SPEED_STEPS = 5;
const STEER_STEPS = 5;
const STEER_MAGIC = 7;
export const FIRE_SECTORS = 12;

const FIRE_SECTOR_STEP = (2 * Math.PI) / FIRE_SECTORS;
const FIRE_BURST = 3;

const BALL_DAMAGE = 1;
const SHIP_HEALTH = 100;

export const TEXTURES_MAP = {
	'white-ship': 'ship_1',
	'gray-ship': 'ship_2',
	'red-ship': 'ship_3',
	'green-ship': 'ship_4',
	'blue-ship': 'ship_5',
	'yellow-ship': 'ship_6',

	'white-ship-damage-1': 'ship_7',
	'gray-ship-damage-1': 'ship_8',
	'red-ship-damage-1': 'ship_9',
	'green-ship-damage-1': 'ship_10',
	'blue-ship-damage-1': 'ship_11',
	'yellow-ship-damage-1': 'ship_12',

	'white-ship-damage-2': 'ship_13',
	'gray-ship-damage-2': 'ship_14',
	'red-ship-damage-2': 'ship_15',
	'green-ship-damage-2': 'ship_16',
	'blue-ship-damage-2': 'ship_17',
	'yellow-ship-damage-2': 'ship_18',

	'white-ship-dead': 'ship_19',
	'gray-ship-dead': 'ship_20',
	'red-ship-dead': 'ship_21',
	'green-ship-dead': 'ship_22',
	'blue-ship-dead': 'ship_23',
	'yellow-ship-dead': 'ship_24',
};

export default class Ship extends Phaser.Physics.Arcade.Sprite {
	shipCapitan;

	shipName;
	shipHealth = SHIP_HEALTH;
	texturePrefix = 'gray-ship';

	cannonballs;

	shipSpeed = 0;
	shipSteer = 0;
	shipFireSector = 0;

	constructor(scene, x, y, texture, frame) {
		super(scene, x, y, texture, frame);

		this.cannonballs = this.scene.physics.add.group({
			classType: Cannonball,
			createCallback: cannonball => cannonball.create(),
			collideWorldBounds: true,
			maxSize: 4,
			key: 'ship',
			frame: CANNONBALL_TEXTURES_MAP.default,
			active: false,
			visible: false,
		});
	}

	create() {
		this.body.onCollide = true;
		this.body.onWorldBounds = true;

		// this.setBodySize(this.width * BODY_SCALE_W, this.height * BODY_SCALE_H, true);
		// arcade physics is AABB and doesnt support body rotation, use circular body
		this.setCircle(this.width / 2, 0, this.height / 2 - this.width / 2);
	}

	preUpdate(t, dt) {
		super.preUpdate(t, dt);

		const bodySpeed = this.shipSpeed * (MAX_SPEED / SPEED_STEPS);
		const bodyAngularVelocity = (this.shipSteer * bodySpeed) / STEER_MAGIC;

		this.setAngularVelocity(bodyAngularVelocity);

		const velocity = new Phaser.Math.Vector2();
		velocity.setToPolar(this.rotation + Math.PI / 2, bodySpeed);
		this.setVelocity(velocity.x, velocity.y);
	}

	setShipCapitan(shipCapitan) {
		this.shipCapitan = shipCapitan;
	}

	onPlayerTurn(data) {
		this.shipSpeed = 0;
		this.shipSteer = 0;
		this.shipFire = 0;

		if (!data) {
			return;
		}

		this.shipState = data.state;

		if (data.speed) {
			this.shipSpeed = Phaser.Math.Clamp(Math.round(data.speed), 0, SPEED_STEPS);
		}
		if (data.steer) {
			this.shipSteer = Phaser.Math.Clamp(Math.round(data.steer), -STEER_STEPS, +STEER_STEPS);
		}
		if (data.fireSector) {
			this.shipFireSector = Phaser.Math.Clamp(Math.round(data.fireSector), 0, FIRE_SECTORS);
			this.onPlayerFire();
		}
	}

	onPlayerFire() {
		if (!this.shipFireSector) {
			return;
		}

		for (let i = 0; i < FIRE_BURST; i++) {
			this.scene.time.delayedCall(100 * i, () => {
				const ball = this.cannonballs.getFirstDead(
					true,
					this.x,
					this.y,
					'ship',
					'cannonBall'
				);
				this.cannonballs.setDepth(20, 1);
				if (ball) {
					const variation = Phaser.Math.FloatBetween(
						-FIRE_SECTOR_STEP / 5,
						+FIRE_SECTOR_STEP / 5
					);
					const fireBearing =
						(this.shipFireSector * FIRE_SECTOR_STEP + this.rotation + variation) %
						(2 * Math.PI);
					ball.fire(fireBearing);
				}
			});
		}
	}

	shipCollide(otherShip) {
		// no collision damage, radar data and collision warning system needed first
	}

	shoreCollide(tile) {
		// no collision damage, radar data and collision warning system needed first
	}

	takeBallDamage() {
		this.shipHealth = Math.max(0, this.shipHealth - BALL_DAMAGE);

		let texture;
		if (this.shipHealth > 66) {
			texture = `${this.texturePrefix}`;
		} else if (this.shipHealth > 33) {
			texture = `${this.texturePrefix}-damage-1`;
		} else if (this.shipHealth > 0) {
			texture = `${this.texturePrefix}-damage-2`;
		} else {
			texture = `${this.texturePrefix}-dead`;
		}

		this.setTexture('ship', TEXTURES_MAP[texture]);
	}
}
