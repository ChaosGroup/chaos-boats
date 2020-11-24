const onGameMessage = (typeof importScripts === 'function'
	? (importScripts('port.js'), self)
	: require('./port')
).port;

////////////////////////////////////////////////////////////
// rudder
///////////////////////////////////////////////////////////

const opsticalAt = at => ship => ship.blockedSector == at;

const opsticalIn = dir => ship => dir.includes(ship.blockedSector);

const opstical = {
    ahead: [11, 12, 1],
    left: [9, 10],
    right: [2, 3]
};

const opsticalAhead = opsticalIn(opstical.ahead);

const opsticalInLeft = opsticalIn(opstical.left);

const opsticalInRight = opsticalIn(opstical.right);

const noOpsctical = opsticalAt(0);

const direction = {
	ahead: randIntInclFunc(-1, 1),
	left: randIntInclFunc(-2, -1),
    right: randIntInclFunc(1, 2)
};

const next = [];

const executeAndRemember = (dir, times = 1) => {
	for(let i = 0; i < times; ++i) {
        next.push(dir);
    }
	return direction[dir]();
};

const targetBearingSectorToRudder = [
     2, // 12
    -2, // 1
    -1, // 2
    -1, // 3
    -1, // 4
    -2, // 5
     0, // 6
     1, // 7
     2, // 8
     1, // 9
     2, // 10
     2, // 11
];

const dangerRange = 80;

const targetToRudder = target => targetBearingSectorToRudder[target.bearingSector % 12];

const targetIsClose = target => target.range <= dangerRange;

const noOpscticalRudder = target => targetIsClose(target)
    ? targetToRudder(target) : direction.ahead();

const smartRudder = (ship, target) => {
    if(noOpsctical(ship)) {
        return noOpscticalRudder(target);
    }
    if(opsticalInLeft(ship) && opsticalInRight(ship)) {
        return executeAndRemember('left', 5);
    }
    if(opsticalInLeft(ship)) {
        return executeAndRemember('right', 2);
    }
    if(opsticalInRight(ship)) {
        return executeAndRemember('left', 2);
    }
    if(opsticalAhead(ship)) {
        return executeAndRemember('right');
    }
    return direction.ahead();
}

const rudder = (ship, target) => {
	if (next.length > 0) {
		const dir = next.pop();
		return direction[dir]();
	}
	return smartRudder(ship, target);
};

////////////////////////////////////////////////////////////
// fire
///////////////////////////////////////////////////////////

const fire = target => {
	const change = target.range >= dangerRange ? randIntIncl(-1, 1) : 0;
	return toClock(target.bearingSector + change);
};

const fireRange = 200;

const fireSector = target => target.range <= fireRange ? fire(target) : 0;

////////////////////////////////////////////////////////////
// speed
///////////////////////////////////////////////////////////

const speed = {
    normal: 3,
    fast: 6
};

const speedBasedOnTarget = target => targetIsClose(target)
    ? speed.fast : speed.normal;

////////////////////////////////////////////////////////////
// turn
///////////////////////////////////////////////////////////

onGameMessage(({ ownShip, targets }) => {
	const target = targets.sort((a, b) => a.range - b.range)[0];
	return {
		speed: speedBasedOnTarget(target),
		rudder: rudder(ownShip, target),
		fireSector: fireSector(target)
	};
});

////////////////////////////////////////////////////////////
// utility
///////////////////////////////////////////////////////////

function toClock(num) {
	const rem = num % 12;
	return rem === 0 ? 12 : rem;
}

function randIntInclFunc(min, max) {
	const m = Math.ceil(min);
	const M = Math.floor(max);
	return () => randIntIncl(m, M);
}

function randIntIncl(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}