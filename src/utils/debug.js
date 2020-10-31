import Phaser from 'phaser';

const TILE_COLOR = null;
const COLLIDE_TILE_COLOR = new Phaser.Display.Color(243, 234, 48, 255);
const FACE_COLOR = new Phaser.Display.Color(40, 39, 37, 255);

export function debugDraw(layer, scene) {
	const debugGraphics = scene.add.graphics().setAlpha(0.7);
	layer.renderDebug(debugGraphics, {
		tileColor: TILE_COLOR,
		collidingTileColor: COLLIDE_TILE_COLOR,
		faceColor: FACE_COLOR,
	});
}
