const port =
	typeof importScripts === 'function'
		? (importScripts('port.js'), self._port)
		: require('./port');

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomIntInclusive(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1) + min);
}

port.onMessage(function ({ data }) {
	const closestTargets = data.targets.filter(t => t.range < 90).sort((a, b) => a.range - b.range);
	const fireSector = closestTargets.length > 0 ? closestTargets[0].bearingSector : 0;
	const haveTargetInProximity = closestTargets.length > 0 && closestTargets[0].range < 30;

	// 0 -> (+6)
	let speed = haveTargetInProximity ? 6 : getRandomIntInclusive(2, 5);

	// (-3) <- 0 -> (+3)
	let rudder = getRandomIntInclusive(-2, +2);
	if (data.ownShip.blockedSector) {
		speed = 6;

		if (data.ownShip.blockedSector === 12) {
			rudder = 3 * getRandomIntInclusive(1, 10) > 3 ? 1 : -1; // pick left or right
		} else if (data.ownShip.blockedSector >= 9) {
			rudder = 3; // turn right
		} else if (data.ownShip.blockedSector <= 3) {
			rudder = -3; // turn left
		}
	}

	port.postMessage({
		speed,
		rudder,
		fireSector,
	});
});
