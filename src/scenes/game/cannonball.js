import Phaser from 'phaser';

const FIRE_DIR_OFFSET = 30;
const CANNONBALL_SPEED = 500;
export const MAX_FIRE_DISTANCE = 500;

export const TEXTURE_ATLAS = 'ship';
export const TEXTURES_MAP = {
	default: 'cannonBall',
	explosion: 'explosion_3',
};

export default class Cannonball extends Phaser.Physics.Arcade.Sprite {
	firedAt = null;

	static GroupConfig = {
		classType: Cannonball,
		createCallback(cannonball) {
			cannonball.create();
		},
		key: TEXTURE_ATLAS,
		frame: TEXTURES_MAP.default,
		maxSize: 5,
		collideWorldBounds: true,
		allowGravity: false,
		allowDrag: true,
		bounceX: 0,
		bounceY: 0,
		dragX: 40,
		dragY: 40,
		active: false,
		visible: false,
	};

	constructor(scene, x, y, key, frame) {
		super(scene, x, y, key, frame);
	}

	create() {
		this.body.onCollide = true;
		this.body.onWorldBounds = true;

		this.setCircle(this.width / 2, 0, 0);
	}

	fire(bearing) {
		this.firedAt = this.getCenter();

		this.setTexture(TEXTURE_ATLAS, TEXTURES_MAP.default);

		const offset = new Phaser.Math.Vector2().setToPolar(bearing, FIRE_DIR_OFFSET);
		this.enableBody(true, this.x + offset.x, this.y + offset.y, true, true);

		this.body.velocity.setToPolar(bearing, CANNONBALL_SPEED);
	}

	stop() {
		this.disableBody(true, true);
		this.firedAt = null;
	}

	shipHit() {
		this.disableBody(true, false);
		this.setTexture(TEXTURE_ATLAS, TEXTURES_MAP.explosion);
		this.scene.time.delayedCall(100, () => {
			this.stop();
		});
	}

	preUpdate(time, delta) {
		super.preUpdate(time, delta);

		const distance = this.firedAt?.distance(this.getCenter());
		if (distance > MAX_FIRE_DISTANCE) {
			this.stop();
		}
	}

	static DieOnWorldBounds(scene) {
		scene.physics.world.on(Phaser.Physics.Arcade.Events.WORLD_BOUNDS, body => {
			if (body.gameObject instanceof Cannonball) {
				body.gameObject.stop();
			}
		});
	}
}
