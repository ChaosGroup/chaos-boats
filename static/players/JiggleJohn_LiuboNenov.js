const onGameMessage = (typeof importScripts === 'function'
	? (importScripts('port.js'), self)
	: require('./port')
).port;

onGameMessage(({ ownShip, targets }) => {
	speed = 4;
	fireSector = 0;
	rudder = getRandomInt(-1, 1);
	let target = targets.sort((a, b) => a.range - b.range)[0];
		if (target.range < 150) {
		speed = 6;
		switch(target.bowSector){
		case 1:
			if(target.bearingSector < 6)
                fireSector = target.bearingSector
            else
			     fireSector = target.bearingSector + 0.5;
					break;
		case 2:
			if(target.bearingSector < 6)
                fireSector = target.bearingSector
            else
			     fireSector = target.bearingSector + 0.5;
					break;
		case 3:
			fireSector = target.bearingSector;
					break;
		case 4:
			if(target.bearingSector < 6)
                fireSector = target.bearingSector
            else
			     fireSector = target.bearingSector + 0.5;
					break;
		case 5:
			if(target.bearingSector < 6)
                fireSector = target.bearingSector
            else
			     fireSector = target.bearingSector + 0.5;
					break;
		case 6:
			fireSector = target.bearingSector;
					break;
		case 7:
			fireSector = target.bearingSector - 0.5;
					break;
		case 8:
			fireSector = target.bearingSector - 0.5;
					break;
		case 9:
			fireSector = target.bearingSector;
					break;
		case 10:
			fireSector = target.bearingSector - 0.5;
					break;
		case 11:
			fireSector = target.bearingSector - 0.5;
					break;
		case 12:
			fireSector = target.bearingSector;
					break;
	}
}


	if (ownShip.blockedSector) {
		speed = 6;
		if (ownShip.blockedSector == 12)
			rudder = getRandomInt(1, 10) > 4 ? 3 : -3;
		 else if (ownShip.blockedSector >= 9) 
			rudder = 3;
		 else if (ownShip.blockedSector <= 3) 
			rudder = -3;
		
	}
	return {
		speed,
		rudder,
		fireSector,
	};
});

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1) + min);
}