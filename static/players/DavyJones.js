const onGameMessage = (typeof importScripts === 'function'
	? (importScripts('port.js'), self)
	: require('./port')
).port;

onGameMessage(({ ownShip, targets }) => {
	const closestTargets = targets.filter(t => t.range < 90).sort((a, b) => a.range - b.range);
	const fireSector = closestTargets.length > 0 ? closestTargets[0].bearingSector : 0;
	const haveTargetInProximity = closestTargets.length > 0 && closestTargets[0].range < 60;

	// 0 -> 6
	let speed = getRandomIntInclusive(2, 5);

	// -3 <- 0 -> +3
	let rudder = getRandomIntInclusive(-2, +2);

	if (haveTargetInProximity) {
		// steer against
		rudder = closestTargets[0].bearingSector >= 6 ? -2 : 2;
	}

	// against ship or land
	if (ownShip.blockedSector) {
		speed = 6; // max speed

		if (ownShip.blockedSector === 12) {
			// in front, pick right or sometimes left
			rudder = 3 * getRandomIntInclusive(1, 10) < 3 ? 1 : -1;
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

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomIntInclusive(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1) + min);
}
