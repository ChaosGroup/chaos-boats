const onGameMessage = (
    typeof importScripts === 'function' ? (importScripts('port.js'), self) : require('./port')
).port;

onGameMessage(({ ownShip, targets }) => {
    let rudder = 0;
    let speed = 6;
    let fireSector = 0;
    let currentTarget = targets.sort((a, b) => a.range - b.range)[0];
    if (currentTarget.range < 160) {
        fireSector = currentTarget.bearingSector;
    }
    if (ownShip.blockedSector) {
        rudder = 3;
    }

    return {
        speed,
        rudder,
        fireSector
    };
});
