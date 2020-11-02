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

export default class Ship extends Phaser.Physics.Arcade.Sprite {
	shipCapitan;

	cannonballs;

	speed = 0;
	steer = 0;

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
			delay: 1000,
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

		const bodySpeed = (this.speed * MAX_SPEED) / SPEED_STEPS;
		const bodyAngularVelocity = (this.steer * bodySpeed) / STEER_MAGIC;

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
		this.speed = 0;
		this.steer = 0;

		const data = this.shipCapitan?.();
		if (!data) {
			return;
		}

		if (data.speed) {
			this.speed = Math.round(Math.max(0, Math.min(SPEED_STEPS, data.speed)));
		}
		if (data.steer) {
			this.steer = Math.round(Math.max(-STEER_STEPS, Math.min(+STEER_STEPS, data.steer)));
		}
	}

	onPlayerFire() {
		const ball = this.cannonballs.get(this.x, this.y, 'ship', 'cannonBall');
		if (ball) {
			this.cannonballs.setDepth(20, 1);
			ball.fire(this.rotation);
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

	hit(ball) {
		ball.stop();
	}

	static createAnimations(anims) {
		anims.create({
			key: 'white-ship-idle',
			frames: [{ key: 'ship', frame: 'ship_1' }],
		});

		anims.create({
			key: 'gray-ship-idle',
			frames: [{ key: 'ship', frame: 'ship_2' }],
		});

		anims.create({
			key: 'red-ship-idle',
			frames: [{ key: 'ship', frame: 'ship_3' }],
		});

		anims.create({
			key: 'green-ship-idle',
			frames: [{ key: 'ship', frame: 'ship_4' }],
		});

		anims.create({
			key: 'blue-ship-idle',
			frames: [{ key: 'ship', frame: 'ship_5' }],
		});

		anims.create({
			key: 'yellow-ship-idle',
			frames: [{ key: 'ship', frame: 'ship_6' }],
		});

		anims.create({
			key: 'white-ship-damage-1',
			frames: [{ key: 'ship', frame: 'ship_7' }],
		});

		anims.create({
			key: 'gray-ship-damage-1',
			frames: [{ key: 'ship', frame: 'ship_8' }],
		});

		anims.create({
			key: 'red-ship-damage-1',
			frames: [{ key: 'ship', frame: 'ship_9' }],
		});

		anims.create({
			key: 'green-ship-damage-1',
			frames: [{ key: 'ship', frame: 'ship_10' }],
		});

		anims.create({
			key: 'blue-ship-damage-1',
			frames: [{ key: 'ship', frame: 'ship_11' }],
		});

		anims.create({
			key: 'yellow-ship-damage-1',
			frames: [{ key: 'ship', frame: 'ship_12' }],
		});

		anims.create({
			key: 'white-ship-damage-2',
			frames: [{ key: 'ship', frame: 'ship_13' }],
		});

		anims.create({
			key: 'gray-ship-damage-2',
			frames: [{ key: 'ship', frame: 'ship_14' }],
		});

		anims.create({
			key: 'red-ship-damage-2',
			frames: [{ key: 'ship', frame: 'ship_15' }],
		});

		anims.create({
			key: 'green-ship-damage-2',
			frames: [{ key: 'ship', frame: 'ship_16' }],
		});

		anims.create({
			key: 'blue-ship-damage-2',
			frames: [{ key: 'ship', frame: 'ship_17' }],
		});

		anims.create({
			key: 'yellow-ship-damage-2',
			frames: [{ key: 'ship', frame: 'ship_18' }],
		});

		anims.create({
			key: 'white-ship-dead',
			frames: [{ key: 'ship', frame: 'ship_19' }],
		});

		anims.create({
			key: 'gray-ship-dead',
			frames: [{ key: 'ship', frame: 'ship_20' }],
		});

		anims.create({
			key: 'red-ship-dead',
			frames: [{ key: 'ship', frame: 'ship_21' }],
		});

		anims.create({
			key: 'green-ship-dead',
			frames: [{ key: 'ship', frame: 'ship_22' }],
		});

		anims.create({
			key: 'blue-ship-dead',
			frames: [{ key: 'ship', frame: 'ship_23' }],
		});

		anims.create({
			key: 'yellow-ship-dead',
			frames: [{ key: 'ship', frame: 'ship_24' }],
		});
	}
}
