import _PLAYERS from '/players.json';

// append unique key prop to every player to keep players.json self validating
const PLAYERS = Object.keys(_PLAYERS).reduce(
	(acc, key) => ((acc[key] = { ..._PLAYERS[key], key }), acc),
	{}
);

export const DEFAULT = [PLAYERS.JackSparrow, PLAYERS.DavyJones];

// set players to enter in game automatically
export const AUTOSTART = [];

export default PLAYERS;
