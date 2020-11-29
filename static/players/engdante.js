const onGameMessage = (typeof importScripts === 'function'
	? (importScripts('port.js'), self)
	: require('./port')
).port;

const RANGE_CLOSE = 80;
const RANGE_FAR = 125;
const RANGE_AWAY = 150;

const MOVE_NORMAL = [0, -2, -1, 0, 1, 2, 3, -3, -2, 0, 1, 2, 3];
const MOVE_FAR = [0, 1, 2, 3, 3, 3, 3, 3, -3, -3, -2, -1, -1];
const MOVE_CLOSE = [0, -3, -3, -3, -2, -2, 0, 2, 2, 3, 3, 3, 3];
const MOVE_HIGH_MORAL = [0, 1, 2, 3, 3, 3, 3, 3, -3, -3, -2, -1, -1];
const MOVE_LOW_MORAL = [0, -3, -3, -3, -2, -2, 0, 2, 2, 3, 3, 3, 3];
const COLLISION = [0, -3, -3, -2, 0, 0, 0, 0, 0, 2, 3, 3, 3];

onGameMessage(({ ownShip, targets: [target] }) => {
	return {
		...move(ownShip, target),
		fireSector: target.bearingSector,
	};
});

function move(ownShip, target) {
	const moral = ownShip.score + target.score > 30 ? ownShip.score / target.score : 1;

	let rudder = 0;
	let speed = 0;

	if ((moral > 0.75) && (moral < 1.25)) {
		if ((target.range < RANGE_AWAY) && (target.range > RANGE_CLOSE)) {
			rudder = MOVE_NORMAL[target.bearingSector];
			speed = 4;
		}

		if (target.range <= RANGE_CLOSE) {
			rudder = MOVE_CLOSE[target.bearingSector];
			speed = 6;
		}

		if (target.range >= RANGE_AWAY) {
			rudder = MOVE_FAR[target.bearingSector];
			speed = 6;
		}
	}

	if (moral <= 0.9) {
		if (target.range < RANGE_FAR) {
			rudder = MOVE_LOW_MORAL[target.bearingSector];
			speed = 6;
		}

		if (target.range >= RANGE_FAR) {
			rudder = MOVE_LOW_MORAL[target.bearingSector];
			speed = 0;
		}
	}

	if (moral >= 1.25) {
		rudder = MOVE_HIGH_MORAL[target.bearingSector];
		speed = 6;
	}

	if (ownShip.blockedSector > 0) {
		rudder = COLLISION[ownShip.blockedSector];
		speed = 6;
	}

	return { rudder, speed };
}
