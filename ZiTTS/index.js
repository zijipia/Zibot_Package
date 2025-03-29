const querystring = require("querystring");

const GOOGLE_TTS_URL = "https://translate.google.com/translate_tts";
const MAX_CHARS = 200;

function splitText(text, maxLength) {
	const sentences = text.match(/[^.!?;:]+[.!?;:]*/g) || [text];
	const parts = [];
	let currentPart = "";

	for (let sentence of sentences) {
		while (sentence.length > maxLength) {
			let splitIndex = sentence.lastIndexOf(" ", maxLength);
			if (splitIndex === -1) splitIndex = maxLength;

			parts.push(sentence.slice(0, splitIndex).trim());
			sentence = sentence.slice(splitIndex).trim();
		}

		if ((currentPart + " " + sentence).trim().length > maxLength) {
			parts.push(currentPart.trim());
			currentPart = sentence;
		} else {
			currentPart += " " + sentence;
		}
	}

	if (currentPart) parts.push(currentPart.trim());

	return parts;
}

function getTTSUrls(text, { lang = "en", slow = false } = {}) {
	if (!text) throw new Error("Text cannot be empty");

	const textParts = splitText(text, MAX_CHARS);
	return textParts.map((part) => {
		const params = {
			ie: "UTF-8",
			q: part,
			tl: lang,
			total: 1,
			idx: 0,
			textlen: part.length,
			client: "tw-ob",
			prev: "input",
			ttsspeed: slow ? 0.3 : 1,
		};

		return `${GOOGLE_TTS_URL}?${querystring.stringify(params)}`;
	});
}

module.exports = { getTTSUrls };
