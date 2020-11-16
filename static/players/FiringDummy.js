const onGameMessage = (typeof importScripts === 'function'
	? (importScripts('port.js'), self)
	: require('./port')
).port;

// stay in place and fire against target
onGameMessage(({ targets }) => {
	const targetsInRange = targets.filter(t => t.range < 90);
	const fireSector = targetsInRange.length > 0 ? targetsInRange[0].bearingSector : 0;

	return {
		speed: 0,
		rudder: 0,
		fireSector,
	};
});
