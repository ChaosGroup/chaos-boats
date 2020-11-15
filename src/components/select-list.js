import Phaser from 'phaser';

import TextButton from './text-button';

const ITEM_HEIGHT = 44;
const BUTTON_HEIGHT = 28;
const VISIBLE_ITEMS = 6;

export const LIST_WIDTH = 400;
export const LIST_HEIGHT = VISIBLE_ITEMS * ITEM_HEIGHT + 2 * BUTTON_HEIGHT;

const EMPTY_ITEM_TEXT = '·';

export default class SelectList extends Phaser.GameObjects.Container {
	start = 0;

	constructor(scene, x, y, style, options, value) {
		super(scene, x, y);

		this.options = options ?? [];
		this.value = value ?? null;

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
			const button = new TextButton(scene, LIST_WIDTH / 2, y, EMPTY_ITEM_TEXT, style);
			button
				.setOrigin(0.5, 0.5) // center center
				.on('click', () => this.onOptionClick(index));
			button.disabled = true;

			return button;
		});

		this.add([this.up, this.down, ...this.items]);

		const valueIndex = this.options.findIndex(o => o.value === this.value);
		if (valueIndex >= 0) {
			this.start = Math.min(valueIndex - 1, Math.max(0, this.options.length - VISIBLE_ITEMS));
		}

		this.updateItems();
	}

	onOptionClick(index) {
		const option = this.options[this.start + index] ?? null;
		if (option && this.value !== option.value) {
			this.value = option.value;
			this.updateItems();

			this.emit('changed', option.value);
		}
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
		this.items.forEach((button, index) => {
			const option = this.options[this.start + index] ?? null;
			const text = !option
				? EMPTY_ITEM_TEXT
				: option.value === this.value
				? `> ${option.text} <`
				: option.text;

			button.setText(text);
			button.disabled = !option;
		});

		this.up.disabled = this.start === 0;
		this.down.disabled = this.start === Math.max(0, this.options.length - VISIBLE_ITEMS);
	}
}
