const onGameMessage = (typeof importScripts === 'function'
        ? (importScripts('port.js'), self)
        : require('./port')
).port;

function getTarget(targets) {
    let target;
    [target] = targets.sort((t1, t2) => { t1.range <= t2.range && t1.health <= t2.health });
    
    return target;
}

function fire(position, target) {
    let clock = [1,2,3,4,5,6,7,8,9,10,11,12];
    let sector = clock.indexOf(target.bearingSector);
    let offset = 1;
    if (target.bowSector >= 1 && target.bowSector <= 6) {
        offset = -1;
    }
    
    if (target.bearingSector === target.bowSector) {
        return target.bearingSector;
    }
    
    if (target.range <= 90) {
        return clock[sector];
    } else if (target.range > 120) {
        return 0;
    }
    
    return randomValue([clock[sector], clock[(sector+offset) % 12]]);
}

function move(current, prev) {
    // obstacle on right
    if (current.blockedSector > 0 && current.blockedSector <= 3) {
        return randomInt(-3, -1);
    }
    // obstacle on left
    else if (current.blockedSector >= 9 && current.blockedSector < 12) {
        
        return randomInt(1, 3);
    }
    else if (current.blockedSector === 0) {
        
        if (null !== prev && prev.blockedSector !== 0) {
        
        }
        return randomValue([-1, 0, 1, 2]);
        
    }
    // in front of us
    else if(null !== prev) {
        if (prev.blockedSector > 0 && prev.blockedSector <= 3) {
            // full left
            return -3;
        } else {
            // full right
            return 3;
        }
    }
    
    return randomValue([-3, 3]);
}

function randomInt(min, max) {
    let values = Array.from({length: (max - min)}, (v, k) => k + min);
    
    return randomValue(values);
}

function randomValue(data) {
    return data[Math.floor(Math.random() * data.length)];
}

let prevData = {};

function render(data) {
    let ship = data.ownShip;
    let target = getTarget(data.targets);
    
    prevData = Object.assign({}, data);

    return {
        speed: 6, // 0 -> 6
        rudder: move(data.ownShip, prevData.ownShip || null), // -3 <- 0 -> +3
        fireSector: fire(ship, target), // 0, 1 -> 12
    };
}

// stay in place
onGameMessage(render);
