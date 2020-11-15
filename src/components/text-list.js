import Phaser from 'phaser';

import TextButton from './text-button';

const ITEM_HEIGHT = 44;
const BUTTON_HEIGHT = 28;
const VISIBLE_ITEMS = 14;

export const LIST_WIDTH = 800;
export const LIST_HEIGHT = VISIBLE_ITEMS * ITEM_HEIGHT + 2 * BUTTON_HEIGHT;

const EMPTY_ITEM_TEXT = '·';

export default class SelectList extends Phaser.GameObjects.Container {
	start = 0;

	constructor(scene, x, y, style, values) {
		super(scene, x, y);

		this.values = values ?? [];

		this.up = new TextButton(
			scene,
			LIST_WIDTH / 2,
			(BUTTON_HEIGHT - LIST_HEIGHT) / 2,
			'⌃',
			style
		);
		this.up
			.setOrigin(0.5, 0.5) // center center
			.on('click', () => this.onUpClick());

		this.down = new TextButton(
			scene,
			LIST_WIDTH / 2,
			(LIST_HEIGHT - BUTTON_HEIGHT) / 2,
			'⌄',
			style
		);
		this.down
			.setOrigin(0.5, 0.5) // center center
			.on('click', () => this.onDownClick());

		this.items = [...Array(VISIBLE_ITEMS).keys()].map(index => {
			const y = ((1 + 2 * index) * ITEM_HEIGHT - VISIBLE_ITEMS * ITEM_HEIGHT) / 2;
			const text = new Phaser.GameObjects.Text(
				scene,
				LIST_WIDTH / 2,
				y,
				EMPTY_ITEM_TEXT,
				style
			);
			text.setOrigin(0.5, 0.5); // center center

			return text;
		});

		this.add([this.up, this.down, ...this.items]);

		this.updateItems();
	}

	onUpClick() {
		this.start -= 1;
		this.updateItems();
	}

	onDownClick() {
		this.start += 1;
		this.updateItems();
	}

	updateItems() {
		this.items.forEach((text, index) => {
			const value = this.values[this.start + index];
			text.setText(value ?? EMPTY_ITEM_TEXT);
		});

		this.up.disabled = this.start === 0;
		this.down.disabled = this.start === Math.max(0, this.values.length - VISIBLE_ITEMS);
	}
}
