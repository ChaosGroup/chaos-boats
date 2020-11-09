// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomIntInclusive(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1) + min);
}

onmessage = function ({ data }) {
	// move randomly and run when close to a target
	const haveTargetsInProximity = data.targets.filter(t => t.range < 30).length > 0;
	const speed = haveTargetsInProximity ? 6 : getRandomIntInclusive(2, 5); // 0 -> (+6)
	const rudder = getRandomIntInclusive(-3, +3); // (-3) <- 0 -> (+3)
    
    postMessage({
		speed,
		rudder,
	});
};
