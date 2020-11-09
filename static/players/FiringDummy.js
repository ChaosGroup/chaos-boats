onmessage = function ({ data }) {
	// stay in place and fire against target
	const targetsInRange = data.targets.filter(t => t.range < 90);
	const fireSector = targetsInRange.length > 0 ? targetsInRange[0].bearingSector : 0;

	postMessage({
		speed: 0,
		rudder: 0,
		fireSector,
	});
};
