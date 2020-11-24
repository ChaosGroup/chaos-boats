const w = 
[
    [
        [
            1.5208340770414353,
            4.408225471092635,
            3.444803606816785,
            0.3123387627333267
        ],
        [
            3.769797795790316,
            -2.889131138575391,
            -4.180441192303826,
            -0.1473841095803703
        ],
        [
            3.6510349754204334,
            2.857330236414549,
            3.492464613659239,
            -3.9026177777301228
        ],
        [
            3.814382574596966,
            3.083889699487601,
            -0.5989780557811772,
            -3.1329742996710936
        ]
    ],
    [
        [
            1.081404824738125,
            -1.0699288585450684,
            4.517709961439438,
            1.6669766023010224
        ],
        [
            3.2567427254996373,
            -2.5770151923160554,
            -0.3272102271811903,
            1.802400191518554
        ],
        [
            -1.3286718885208177,
            -4.6557702953783,
            3.3322832643407847,
            1.947234847714408
        ],
        [
            -0.03137837722629966,
            -3.5333538085612646,
            1.5484380791610843,
            1.7012392341484297
        ]
    ],
    [
        [
            3.610776279303176,
            -1.2846188419607483,
            -0.9774722350217759,
            -1.4042098632520004
        ],
        [
            3.901033220062272,
            0.37764017754701484,
            -3.9162254524116524,
            -1.6210924659793546
        ],
        [
            3.5516262051577923,
            1.7672784654254485,
            2.3759271136139763,
            4.601428196653185
        ]
    ]
];

const onGameMessage = (typeof importScripts === 'function'
	? (importScripts('port.js'), self)
	: require('./port')
).port;

onGameMessage(({ ownShip, targets }) => {

	let t = targets[0];
	let normalized_input = [t.speed / 6, t.range / 200, t.bearingSector / 12, t.bowSector / 12];
	
	return calcNetwork(normalized_input, w);
});

function clamp(value, min = 0, max = 1) {
    return Math.max(Math.min(value, max), min);
}

function dotProduct(a, b) {
    let sum = 0.;
    for (let i = 0; i < a.length; i++){
        sum += a[i] * b[i];
    }
    return sum;
}

function calcLayer(a, w, activation) {

    let arr = [];
    for(let i = 0; i< w.length; i++) {
        let result = dotProduct(a, w[i])
        let normalized= activation(result);
        arr.push(normalized);
    }
    return arr;
}

function calcNetwork(input, weights) {
    let i = input;
    let w = [weights[0], weights[1], weights[2]];

    let l1 = calcLayer(i, w[0], clamp);
    let l2 = calcLayer(l1, w[1], clamp);
    let o = calcLayer(l2, w[2], clamp);

    // 0 -> 6
    let speed = Math.round(o[0] * 6);
    // -3 <- 0 -> +3
    let rudder =  Math.round(o[1] * 6 - 3);
    // 0, 1 -> 12
    let fireSector = Math.round(o[2] * 12);

    return {speed, rudder, fireSector};
}