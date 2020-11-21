const onGameMessage = (typeof importScripts === 'function'
	? (importScripts('port.js'), self)
	: require('./port')
).port;

const opsticalAt = at => ship => ship.blockedSector == at;

const opsticalAhead = opsticalAt(12);

const opsticalIn = dir => ship => dir.includes(ship.blockedSector);

const left = [9, 10, 11];

const right = [1, 2, 3];

const opsticalInLeft = opsticalIn(left);

const opsticalInRight = opsticalIn(right);

const noOpsctical = opsticalAt(0);;

const fire = target => {
    const change = target.range >= 80 ? randIntIncl(-1, 1) : 0;
    return toClock(target.bearingSector + change);
}

const fireSector = target => target.range <= 100 ? fire(target) : 0;

const direction = {
    ahead: () => randIntIncl(-1, 1),
    left: () => randIntIncl(-2, -1),
    right: () => randIntIncl(1, 2),
    rand: () => randIntIncl(randIntIncl(-2, -1), randIntIncl(1, 2))
};

const rudder = ship => noOpsctical(ship)
    ? direction.rand()  : opsticalAhead(ship) || opsticalInLeft(ship)
    ? direction.right() : opsticalAhead(ship) || opsticalInRight(ship)
    ? direction.left()  : direction.ahead();

onGameMessage(({ ownShip, targets }) => {
    const target = targets[0];
    return {
        speed: 6,
        rudder: rudder(ownShip),
        fireSector: fireSector(target)  
    };
});

function toClock(num) {
    const rem = num % 12;
    return rem === 0 ? 12 : rem;
}

function randIntIncl(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1) + min);
}