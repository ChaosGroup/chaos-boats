import Phaser from 'phaser';

import Cannonball, {
	TEXTURES_MAP as CANNONBALL_TEXTURES_MAP,
	TEXTURE_ATLAS as CANNONBALL_TEXTURE_ATLAS,
} from './cannonball';

export const MAX_SPEED = 350;
export const SPEED_STEPS = 5;
const RUDDER_STEPS = 3;
const RUDDER_FACTOR = 0.25;
export const FIRE_SECTORS = 12;

const FIRE_SECTOR_STEP = (2 * Math.PI) / FIRE_SECTORS;
const FIRE_BURST = 3;

const BALL_DAMAGE = 10; // HACK:
const SHIP_HEALTH = 100;

export const TEXTURE_ATLAS = 'ship';
export const TEXTURES_MAP = {
	whiteShip: {
		name: 'Adventure Galley',
		default: 'ship_1',
		damage1: 'ship_7',
		damage2: 'ship_13',
		sunk: 'ship_19',
	},
	grayShip: {
		name: 'Black Pearl',
		default: 'ship_2',
		damage1: 'ship_8',
		damage2: 'ship_14',
		sunk: 'ship_20',
	},
	redShip: {
		name: 'Royal Fortune',
		default: 'ship_3',
		damage1: 'ship_9',
		damage2: 'ship_15',
		sunk: 'ship_21',
	},
	greenShip: {
		name: 'Queen Anne’s Revenge',
		default: 'ship_4',
		damage1: 'ship_10',
		damage2: 'ship_16',
		sunk: 'ship_22',
	},
	blueShip: {
		name: 'Jolly Roger',
		default: 'ship_5',
		damage1: 'ship_11',
		damage2: 'ship_17',
		sunk: 'ship_23',
	},
	yellowShip: {
		name: 'Whydah',
		default: 'ship_6',
		damage1: 'ship_12',
		damage2: 'ship_18',
		sunk: 'ship_24',
	},
};

export function getSector(angle) {
	return (Math.round(angle / FIRE_SECTOR_STEP) + FIRE_SECTORS) % FIRE_SECTORS || FIRE_SECTORS;
}

export default class Ship extends Phaser.Physics.Arcade.Sprite {
	shipPlayer;

	shipHealth = SHIP_HEALTH;
	shipTexture = TEXTURES_MAP.grayShip;

	cannonballs;

	shipSpeed = 0;
	shipRudder = 0;
	shipFireSector = 0;
	shipBlockedSector = 0;

	static GroupConfig = {
		classType: Ship,
		createCallback: ship => ship.create(),
		collideWorldBounds: true,
		allowRotation: true,
		allowGravity: false,
		bounceX: 0,
		bounceY: 0,
	};

	constructor(scene, x, y, texture, frame) {
		super(scene, x, y, texture, frame);

		this.cannonballs = this.scene.physics.add.group(Cannonball.GroupConfig);
	}

	create() {
		this.body.onCollide = true;
		this.body.onWorldBounds = true;

		// arcade physics is AABB and doesnt support body rotation, use circular body
		this.setCircle(this.width / 2, 0, this.height / 2 - this.width / 2);
	}

	preUpdate(t, dt) {
		super.preUpdate(t, dt);

		this.setBlockedSector();

		const heading = this.rotation + Math.PI / 2;
		const bodySpeed = this.shipSpeed * (MAX_SPEED / SPEED_STEPS);
		const bodyAngularVelocity = this.shipRudder * bodySpeed * RUDDER_FACTOR;

		this.body.angularVelocity = bodyAngularVelocity;
		this.body.velocity.setToPolar(heading, bodySpeed);
	}

	setBlockedSector() {
		this.shipBlockedSector = 0;

		if (this.shipSpeed === 0) {
			return;
		}

		if (this.body.velocity.length() < 1) {
			this.shipBlockedSector = FIRE_SECTORS;
			return;
		}

		const heading = new Phaser.Math.Vector2().setToPolar(this.rotation + Math.PI / 2);
		const velocity = this.body.velocity.clone().normalize();
		const blockedSector = getSector(Math.atan2(velocity.cross(heading), velocity.dot(heading)));
		if (blockedSector !== FIRE_SECTORS) {
			this.shipBlockedSector = blockedSector;
			return;
		}
	}

	onPlayerTurn(data) {
		this.shipSpeed = 0;
		this.shipRudder = 0;
		this.shipFire = 0;

		if (!this.shipHealth || !data) {
			return;
		}

		this.shipState = data.state;

		if (data.speed) {
			this.shipSpeed = Phaser.Math.Clamp(Math.round(data.speed), 0, SPEED_STEPS);
		}
		if (data.rudder) {
			this.shipRudder = Phaser.Math.Clamp(
				Math.round(data.rudder),
				-RUDDER_STEPS,
				+RUDDER_STEPS
			);
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
					CANNONBALL_TEXTURE_ATLAS,
					CANNONBALL_TEXTURES_MAP.default
				);
				this.cannonballs.setDepth(20, 1);
				if (ball) {
					const heading = this.rotation + Math.PI / 2;
					const variation = Phaser.Math.FloatBetween(
						-FIRE_SECTOR_STEP / 5,
						+FIRE_SECTOR_STEP / 5
					);
					const fireBearing =
						(this.shipFireSector * FIRE_SECTOR_STEP + heading + variation) %
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

		const shipTexture = this.shipTexture ?? TEXTURES_MAP.grayShip;
		if (this.shipHealth > 66) {
			this.setTexture(TEXTURE_ATLAS, shipTexture.default);
		} else if (this.shipHealth > 33) {
			this.setTexture(TEXTURE_ATLAS, shipTexture.damage1);
		} else if (this.shipHealth > 0) {
			this.setTexture(TEXTURE_ATLAS, shipTexture.damage2);
		} else {
			this.setTexture(TEXTURE_ATLAS, shipTexture.sunk);

			this.disableBody(false, false);
			this.setDepth(9);
		}
	}
}
