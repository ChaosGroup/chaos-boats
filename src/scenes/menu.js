import Phaser from 'phaser';

import PLAYERS from '/players';

import TextButton from '/components/text-button';
import SelectList, { LIST_WIDTH } from '/components/select-list';

const CANVAS_SIZE = 960;
const TILE_SIZE = 64;
const MAP_SIZE = 30;
const TILE_SCALE = CANVAS_SIZE / (MAP_SIZE * TILE_SIZE);
const HALF_CANVAS_SIZE = CANVAS_SIZE / 2;

const BASE_TEXT_STYLE = {
	fontFamily: 'Eczar, serif',
	fontSize: 32,
	color: '#ffffff',
	stroke: '#6c8587',
	strokeThickness: 4,
	align: 'center',
};

const MESSAGE_TEXT_STYLE = {
	...BASE_TEXT_STYLE,
	fontSize: 30,
};

const HEADER_TEXT_STYLE = {
	...BASE_TEXT_STYLE,
	fontSize: 46,
};

const BUTTON_TEXT_STYLE = {
	...BASE_TEXT_STYLE,
	fontSize: 38,
};

export default class MenuScene extends Phaser.Scene {
	constructor() {
		super('menu');
	}

	create(data) {
		[this.player1, this.player2] = data?.players ?? [];

		const tilemap = this.make.tilemap({ key: 'arena-map' });
		tilemap.addTilesetImage('pirates', 'tiles');
		tilemap
			.createStaticLayer(tilemap.getLayerIndexByName('sea'), 'pirates', 0, 0)
			.setDepth(0)
			.setScale(TILE_SCALE);
		tilemap
			.createStaticLayer(tilemap.getLayerIndexByName('shore'), 'pirates', 0, 0)
			.setDepth(1)
			.setScale(TILE_SCALE);

		this.header = this.add
			.text(HALF_CANVAS_SIZE, 80, 'Chaos @ js.talks(); 2020', HEADER_TEXT_STYLE)
			.setOrigin(0.5, 0) // center top
			.setDepth(5);

		this.message = this.add
			.text(
				HALF_CANVAS_SIZE,
				170,
				[
					'Chaos is challenging You to enter in a Great Sea Battle against ferocious opponents.',
					'Program your own Bo(a)t in this Open-source Coding Game by forking the GitHub repo and starting a Pull request.',
				].join(' '),
				MESSAGE_TEXT_STYLE
			)
			.setOrigin(0.5, 0) // center top
			.setDepth(5)
			.setWordWrapWidth(800);

		this.boardButton = this.add
			.existing(
				new TextButton(
					this,
					HALF_CANVAS_SIZE,
					360,
					'< Check the Leaderboard >',
					BUTTON_TEXT_STYLE
				)
			)
			.setOrigin(0.5, 0)
			.setDepth(5)
			.on('click', () => this.onBoardClick());

		this.opponentsText = this.add
			.text(HALF_CANVAS_SIZE, 430, '', BUTTON_TEXT_STYLE)
			.setOrigin(0.5, 0) // center top
			.setDepth(5);

		this.startButton = this.add
			.existing(
				new TextButton(
					this,
					HALF_CANVAS_SIZE,
					CANVAS_SIZE - 100,
					'< Start >',
					BUTTON_TEXT_STYLE
				)
			)
			.setOrigin(0.5, 0)
			.setDepth(5)
			.on('click', () => this.onStartClick());

		const playerOptions = Object.keys(PLAYERS).map(pkey => {
			return { value: pkey, text: PLAYERS[pkey].name };
		});

		this.player1Select = this.add
			.existing(
				new SelectList(
					this,
					CANVAS_SIZE / 2 - (LIST_WIDTH + 30),
					710,
					BASE_TEXT_STYLE,
					playerOptions,
					this.player1?.key ?? null
				)
			)
			.setDepth(5)
			.on('changed', key => {
				this.player1 = PLAYERS[key];
				this.updateOponents();
			});

		this.player2Select = this.add
			.existing(
				new SelectList(
					this,
					CANVAS_SIZE / 2 + 30,
					710,
					BASE_TEXT_STYLE,
					playerOptions,
					this.player2?.key ?? null
				)
			)
			.setDepth(5)
			.on('changed', key => {
				this.player2 = PLAYERS[key];
				this.updateOponents();
			});

		this.updateOponents();
	}

	onBoardClick() {
		this.scene.start('board');
	}

	onStartClick() {
		if (this.player1 && this.player2) {
			this.scene.start('game', { players: [this.player1, this.player2] });
		}
	}

	updateOponents() {
		this.opponentsText.setText(
			[
				'Now let the Battle commence',
				`> ${this.player1?.name ?? '?'} vs ${this.player2?.name ?? '?'} <`,
			].join('\n')
		);
		this.startButton.disabled = !this.player1 || !this.player2;
	}
}
