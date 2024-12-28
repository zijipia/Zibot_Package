const { TextToSpeech } = require("./Extractor/TextToSpeech");
const { ZiExtractor } = require("./Extractor/ZiExtractor");
const { ZiVoiceExtractor, useZiVoiceExtractor } = require("./Extractor/ZiVoiceExtractor");

module.exports = {
	ZiExtractor,
	ZiVoiceExtractor,
	useZiVoiceExtractor,
	TextToSpeech,
};
