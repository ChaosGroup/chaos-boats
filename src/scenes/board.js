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
	fontSize: 30,
	color: '#ffffff',
	stroke: '#6c8587',
	strokeThickness: 4,
	align: 'center',
};

const HEADER_TEXT_STYLE = {
	...BASE_TEXT_STYLE,
	fontSize: 46,
};

export default class BoardScene extends Phaser.Scene {
	constructor() {
		super('board');
	}

	create() {
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

		// this.chaosLogo = this.add
		// 	.image(HALF_CANVAS_SIZE, 100, 'chaos-logo')
		// 	.setDepth(5)
		// 	.setScale(0.8);

		this.header = this.add
			.text(
				HALF_CANVAS_SIZE,
				80,
				['Chaos @ js.talks(); 2020', 'Leaderboard'].join('\n'),
				HEADER_TEXT_STYLE
			)
			.setOrigin(0.5, 0) // center top
			.setDepth(5);

		this.stopButton = this.add
			.existing(
				new TextButton(this, 50, CANVAS_SIZE - 75, '< Menu >', {
					...BASE_TEXT_STYLE,
					fontSize: 24,
				})
			)
			.setOrigin(0, 0) // left top align
			.setDepth(5)
			.on('click', () => this.onStopClick());
	}

	onStopClick() {
		this.scene.start('menu');
	}
}
