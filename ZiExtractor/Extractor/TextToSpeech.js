const { BaseExtractor } = require("discord-player");
const googleTTS = require("google-tts-api");

async function getStream(query, extractor) {
	try {
		const streamUrl = googleTTS.getAudioUrl(query.description, {
			lang: query.raw?.lang || "vi",
			slow: query.raw?.slow || false,
			host: query.raw?.host || "https://translate.google.com",
		});

		if (streamUrl) {
			extractor.log(`Stream URL found: ${streamUrl}`);
			return streamUrl;
		}

		extractor.log(`Stream not found on attempt #${retry + 1}`);
	} catch (error) {
		extractor.log(`Error in getStream: ${error.message}`);
		console.error(error);
	}
	return null;
}

class TextToSpeech extends BaseExtractor {
	static identifier = "com.Ziji.discord-player.tts";
	constructor(options) {
		super(options);
		this._stream = options.createStream || getStream;
		this._options = options;
	}
	protocols = ["tts", "TextToSpeech"];
	// 	// 	// 	// 	// 	// 	//
	async activate() {
		this.log("Activating TextToSpeech");
	}

	async deactivate() {
		this.log("Deactivating TextToSpeech");
	}

	validate(query, type) {
		return type === "tts";
	}

	log(message) {
		this.context?.player?.debug(`[TextToSpeech] ${message}`);
	}

	emptyResponse() {
		this.log("Returning empty response");
		return { playlist: null, tracks: [] };
	}

	stream(info) {
		this.log(`Streaming info for: ${info.url}`);
		return this._stream(info, this);
	}
}

module.exports = { TextToSpeech };
