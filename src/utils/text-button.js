import Phaser from 'phaser';

const BASE_STYLE = { color: '#ffffff', stroke: '#6c8587', strokeThickness: 4 };
const HOVER_STYLE = { color: '#dbf6f8', stroke: '#6c8587', strokeThickness: 4 };
const ACTIVE_STYLE = { color: '#637c7e', stroke: '#96b0b2', strokeThickness: 1 };
const DISABLED_STYLE = { color: '#dbf6f8', stroke: '#a4bec0', strokeThickness: 4 };

export default class TextButton extends Phaser.GameObjects.Text {
	_over = false;
	_down = false;

	constructor(scene, x, y, text, style) {
		super(scene, x, y, text, {
			...style,
			align: 'center',
		});

		this.setPadding(4, 1);

		this.setInteractive({ useHandCursor: true })
			.on('pointerover', () => this.onPointerOver())
			.on('pointerout', () => this.onPointerOut())
			.on('pointerdown', () => this.onPointerDown())
			.on('pointerup', () => this.onPointerUp());
	}

	get disabled() {
		return !this.input.enabled;
	}

	set disabled(value) {
		if (this.disabled !== !!value) {
			if (value) {
				this.disableInteractive();
				this.setStyle(DISABLED_STYLE);
			} else {
				this.setInteractive();
				this.setStyle(this._over ? HOVER_STYLE : BASE_STYLE);
			}
		}
	}

	onPointerOver() {
		if (this.disabled) {
			return;
		}

		if (!this._over) {
			this.setStyle(HOVER_STYLE);
		}
		this._over = true;
	}

	onPointerOut() {
		if (this.disabled) {
			return;
		}

		this.setStyle(BASE_STYLE);
		this._over = false;
		this._down = false;
	}

	onPointerDown() {
		if (this.disabled) {
			return;
		}
		this.setStyle(ACTIVE_STYLE);
		this._down = true;
	}

	onPointerUp() {
		if (this.disabled) {
			return;
		}
		this.setStyle(HOVER_STYLE);

		if (this._down) {
			this.emit('click');
		}
		this._down = false;
	}
}
