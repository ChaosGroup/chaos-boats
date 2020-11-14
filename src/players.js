import _PLAYERS from '/players.json';

// append unique key prop to every player to keep players.json self validating
const PLAYERS = Object.keys(_PLAYERS).reduce(
	(acc, key) => ((acc[key] = { ..._PLAYERS[key], key }), acc),
	{}
);

export const DEFAULT = [PLAYERS.FiringDummy, PLAYERS.MovingDummy];

// set players to enter in game automaticaly
export const AUTOSTART = [PLAYERS.JackSparrow, PLAYERS.FiringDummy];

export default PLAYERS;
