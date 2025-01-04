const { BaseExtractor } = require("discord-player");
const googleTTS = require("google-tts-api");
const fetch = require("node-fetch");
const { Readable } = require("stream");

async function fetchAudioBuffer(url) {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch audio from URL: ${url}`);
	}
	return response.arrayBuffer();
}

function mergeBuffers(buffers) {
	const totalLength = buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);
	const mergedBuffer = new Uint8Array(totalLength);
	let offset = 0;

	for (const buffer of buffers) {
		mergedBuffer.set(new Uint8Array(buffer), offset);
		offset += buffer.byteLength;
	}

	return Buffer.from(mergedBuffer);
}

async function getStream(query, extractor) {
	try {
		const streamUrls = googleTTS.getAllAudioUrls(query.raw.context, {
			lang: query.raw?.lang || "vi",
			slow: query.raw?.slow || false,
			host: query.raw?.host || "https://translate.google.com",
		});

		if (!streamUrls || streamUrls.length === 0) {
			throw new Error("No audio URLs returned by Google TTS.");
		}

		extractor.log(`Fetching ${streamUrls.length} audio parts...`);
		const audioBuffers = await Promise.all(streamUrls.map(({ url }) => fetchAudioBuffer(url)));

		extractor.log("Merging audio buffers...");
		const mergedBuffer = mergeBuffers(audioBuffers);

		extractor.log("Creating readable stream...");
		return Readable.from([mergedBuffer]);
	} catch (error) {
		extractor.log(`Error in getStream: ${error.message}`);
		console.error(error);
		return null;
	}
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
