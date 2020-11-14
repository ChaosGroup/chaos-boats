const DataUriParser = require('datauri/parser');

function polyfillObjectURL(window) {
	const parser = new DataUriParser();

	window.URL.createObjectURL = function (blob) {
		if (blob) {
			const buffer = blob[Object.getOwnPropertySymbols(blob)[0]]._buffer; // HACK: ??
			return parser.format(blob.type, buffer).content;
		}
	};

	window.URL.revokeObjectURL = function () {};
}

module.exports = polyfillObjectURL;
