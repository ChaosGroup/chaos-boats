import Phaser from 'phaser';

import Cannonball from './cannonball';

// enum HealthState
// {
// 	IDLE,
// 	DAMAGE_1,
// 	DAMAGE_2,
// 	DEAD
// }

// const BODY_SCALE_W = 0.7;
// const BODY_SCALE_H = 0.8;

const MAX_SPEED = 350;
const SPEED_STEPS = 5;
const STEER_STEPS = 5;
const STEER_MAGIC = 7;
const FIRE_SECTORS = 12;

const TEXTURES_MAP = {
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
			maxSize: 3,
			key: 'ship',
			frame: 'cannonBall',
			active: false,
			visible: false,
		});

		this.playerTurnEvent = scene.time.addEvent({
			delay: 750,
			callback: this.onPlayerTurn,
			callbackScope: this,
			loop: true,
		});

		// HACK: auto fire
		this.playerFireEvent = scene.time.addEvent({
			delay: 500,
			callback: this.onPlayerFire,
			callbackScope: this,
			loop: true,
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

		const bodySpeed = (this.shipSpeed * MAX_SPEED) / SPEED_STEPS;
		const bodyAngularVelocity = (this.shipSteer * bodySpeed) / STEER_MAGIC;

		this.setAngularVelocity(bodyAngularVelocity);

		const velocity = new Phaser.Math.Vector2();
		velocity.setToPolar(this.rotation + Math.PI / 2, bodySpeed);
		this.setVelocity(velocity.x, velocity.y);
	}

	destroy(fromScene) {
		this.playerTurnEvent?.destroy();
		this.playerFireEvent?.destroy();

		super.destroy(fromScene);
	}

	setShipCapitan(shipCapitan) {
		this.shipCapitan = shipCapitan;
	}

	onPlayerTurn() {
		this.shipSpeed = 0;
		this.shipSteer = 0;
		this.shipFire = 0;

		const data = this.shipCapitan?.();
		if (!data) {
			return;
		}

		if (data.speed) {
			this.shipSpeed = Math.round(Math.max(0, Math.min(SPEED_STEPS, data.speed)));
		}
		if (data.steer) {
			this.shipSteer = Math.round(Math.max(-STEER_STEPS, Math.min(+STEER_STEPS, data.steer)));
		}
		if (data.fireSector) {
			this.shipFireSector = Math.round(Math.max(0, Math.min(FIRE_SECTORS, data.fireSector)));
		}
	}

	onPlayerFire() {
		if (!this.shipFireSector) {
			return;
		}

		const ball = this.cannonballs.get(this.x, this.y, 'ship', 'cannonBall');
		if (ball) {
			this.cannonballs.setDepth(20, 1);
			const fireBearing =
				(this.shipFireSector * ((2 * Math.PI) / FIRE_SECTORS) + this.rotation) %
				(2 * Math.PI);
			ball.fire(fireBearing);
		}
	}

	shipCollide(otherShip) {
		// no collision damage, radar data and collision warning system needed first
		// console.log('shipCollide', this, otherShip);
	}

	shoreCollide(tile) {
		// no collision damage, radar data and collision warning system needed first
		// console.log('shoreCollide', tile);
	}

	takeBallDamage() {}
}
