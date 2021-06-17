const onGameMessage = (
	typeof importScripts === 'function' ? (importScripts('port.js'), self) : require('./port')
).port;

function getTarget(targets) {
	let target;
	[target] = targets.sort((t1, t2) => {
		t1.range <= t2.range && t1.health <= t2.health;
	});

	return target;
}

// eslint-disable-next-line no-unused-vars
function fire(ownShip, target) {
	var fireSector;
	switch (ownShip.rudder) {
		case 2:
		case 3:
			if (target.bearingSector <= 2) fireSector = 12;
			else fireSector = target.bearingSector - 2;
			break;
		case -2:
		case -3:
			if (target.bearingSector >= 11) fireSector = 12;
			else fireSector = target.bearingSector + 2;
			break;
		case 1:
			if (target.bearingSector <= 1) fireSector = 12;
			else fireSector = target.bearingSector - 1;
			break;
		case -1:
			if (target.bearingSector >= 12) fireSector = 1;
			else fireSector = target.bearingSector + 1;
			break;
		case 0:
			fireSector = target.bearingSector;
			break;
	}
	return fireSector;
}

onGameMessage(({ ownShip, targets }) => {
	let speed = 0;
	let rudder = 0;
	let fireSector = 0;
	let target = getTarget(targets);
	if (target.range < 80) {
		if (target.health < 20) {
			rudder = target.bowSector;
		}
		rudder = target.bearingSector > 6 ? -1 : 1;
		fireSector = target.bearingSector;
		speed = 5;
	} else {
		speed = 5;
		rudder = getRandomIntInclusive(-3, 3);
		if (rudder === 0) rudder = 1;
		fireSector = target.bearingSector;
	}
	if (target.bowSector > 5 && target.bowSector < 7) {
		speed = 6;
		rudder = 3;
		fireSector = 2;
	}

	if (ownShip.blockedSector) {
		speed = 6;
		if (ownShip.blockedSector == 12) rudder = getRandomIntInclusive(1, 10) > 6 ? 3 : -3;
		else if (ownShip.blockedSector >= 9) rudder = 3;
		else if (ownShip.blockedSector <= 3) rudder = -3;
	}

	return {
		speed,
		rudder,
		fireSector,
	};
});

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomIntInclusive(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1) + min);
}
