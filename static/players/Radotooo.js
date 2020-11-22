const onGameMessage = (typeof importScripts === 'function'
	? (importScripts('port.js'), self)
	: require('./port')
).port;

onGameMessage(({ ownShip, targets }) => {
	//player default stats
	let speed = 4;
	let fireSector = 0;
	let rudder = getRandomIntInclusive(-1, 1);

	//get closest target
	let currentTarget = targets.sort((a, b) => a.range - b.range)[0];

	//set fire trajectory
	if (currentTarget.range < 150) {
		speed = 6;
		fireSector = currentTarget.bearingSector;
	}

	// against ship or land
	if (ownShip.blockedSector) {
		speed = 6;
		if (ownShip.blockedSector === 12) {
			// in front, pick right or sometimes left
			rudder = getRandomIntInclusive(1, 10) > 3 ? 2 : -2;
		} else if (ownShip.blockedSector >= 9) {
			// at left, turn right
			rudder = 3;
		} else if (ownShip.blockedSector <= 3) {
			// at right, turn left
			rudder = -3;
		}
	}

	return {
		speed,
		rudder,
		fireSector,
	};
});

function getRandomIntInclusive(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1) + min);
}
