const { BaseExtractor, QueryType, Track, Playlist, Util } = require("discord-player");
const SoundCloud = require("@zibot/scdl");

class SoundCloudExtractor extends BaseExtractor {
	static identifier = "com.zibot.extractor.soundcloud";

	constructor(options = {}) {
		super(options);
		this.scdl = new SoundCloud({ init: true });
		this.initialized = false;
	}

	async activate() {
		if (!this.initialized) {
			await this.scdl.init();
			this.initialized = true;
		}
	}

	async deactivate() {
		this.log("Deactivating SoundCloud extractor");
	}

	validate(query, type) {
		return typeof query === "string" && (query.includes("soundcloud.com") || type.toLowerCase().includes("soundcloud"));
	}

	log(...args) {
		console.log("[SoundCloudExtractor]", ...args);
	}

	emptyResponse() {
		return { playlist: null, tracks: [] };
	}

	stream(track) {
		return this.scdl.downloadTrack(track.url);
	}

	async handle(query, context) {
		try {
			if (query.includes("/sets/") || context.type === QueryType.SOUNDCLOUD_PLAYLIST) {
				return await this.handlePlaylist(query, context);
			}

			if (context.type === QueryType.SOUNDCLOUD_SEARCH || (!query.startsWith("http") && !query.startsWith("https"))) {
				return await this.handleSearch(query, context);
			}

			return await this.handleTrack(query, context);
		} catch (err) {
			this.log("Error in handle:", err.message);
			return this.emptyResponse();
		}
	}

	async handleSearch(query, context) {
		const results = await this.scdl.searchTracks({ query, limit: 20 });
		if (!results.length) return this.emptyResponse();

		const tracks = results.map((track) => this.buildTrack(track, context));
		return { playlist: null, tracks };
	}

	async handleTrack(url, context) {
		const track = await this.scdl.getTrackDetails(url);
		if (!track) return this.emptyResponse();

		return { playlist: null, tracks: [this.buildTrack(track, context)] };
	}

	async handlePlaylist(url, context) {
		const playlistData = await this.scdl.getPlaylist(url);
		if (!playlistData || !playlistData.tracks?.length) return this.emptyResponse();

		const playlist = new Playlist(this.context.player, {
			title: playlistData.title,
			description: playlistData.description,
			thumbnail: playlistData.artwork_url || "",
			type: "playlist",
			source: "soundcloud",
			author: {
				name: playlistData.user?.username,
				url: playlistData.user?.permalink_url,
			},
			id: playlistData.id,
			url: playlistData.permalink_url,
			rawPlaylist: playlistData,
		});

		playlist.tracks = playlistData.tracks.map((track) => this.buildTrack(track, context, playlist));

		return { playlist, tracks: playlist.tracks };
	}

	buildTrack(data, context, playlist = null) {
		return new Track(this.context.player, {
			title: data.title,
			description: data.description || "",
			author: data.user?.username || "Unknown",
			url: data.permalink_url,
			thumbnail: data.artwork_url || data.user?.avatar_url || "",
			duration: Util.buildTimeCode(Util.parseMS(data.duration)),
			source: "soundcloud",
			requestedBy: context?.requestedBy,
			playlist,
			raw: data,
			metadata: data,
			queryType: QueryType.SOUNDCLOUD,
			async requestMetadata() {
				return data;
			},
		});
	}
}

module.exports = { SoundCloudExtractor };
