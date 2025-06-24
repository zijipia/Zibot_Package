const {
	joinVoiceChannel,
	createAudioPlayer,
	AudioPlayerStatus,
	getVoiceConnection,
	entersState,
	VoiceConnectionStatus,
	createAudioResource,
	StreamType,
} = require("@discordjs/voice");
const { EventEmitter } = require("events");

const QueryType = {
	AUTO: "auto",
	YOUTUBE: "youtube",
	YOUTUBE_PLAYLIST: "youtubePlaylist",
	SOUNDCLOUD_TRACK: "soundcloudTrack",
	SOUNDCLOUD_PLAYLIST: "soundcloudPlaylist",
	SOUNDCLOUD: "soundcloud",
	SPOTIFY_SONG: "spotifySong",
	SPOTIFY_ALBUM: "spotifyAlbum",
	SPOTIFY_PLAYLIST: "spotifyPlaylist",
	SPOTIFY_SEARCH: "spotifySearch",
	FACEBOOK: "facebook",
	VIMEO: "vimeo",
	ARBITRARY: "arbitrary",
	REVERBNATION: "reverbnation",
	YOUTUBE_SEARCH: "youtubeSearch",
	YOUTUBE_VIDEO: "youtubeVideo",
	SOUNDCLOUD_SEARCH: "soundcloudSearch",
	APPLE_MUSIC_SONG: "appleMusicSong",
	APPLE_MUSIC_ALBUM: "appleMusicAlbum",
	APPLE_MUSIC_PLAYLIST: "appleMusicPlaylist",
	APPLE_MUSIC_SEARCH: "appleMusicSearch",
	FILE: "file",
	AUTO_SEARCH: "autoSearch",
};

class PlayerManager extends EventEmitter {
	constructor(client, options = {}) {
		super();
		this.client = client;
		this.players = new Map();
		this.extractors = options.extractors || [];
		this.initExtractors(this.extractors);
	}

	async initExtractors(extractors) {
		for (const extractor of extractors) {
			if (typeof extractor.activate === "function") {
				await extractor.activate();
			}
			if (typeof extractor.on === "function") {
				extractor.on("debug", (message) => this.debug(message));
			}
		}
		this.debug(`Initialized ${extractors.length} extractors.`);
		this.emit("ready");
	}

	debug(message) {
		if (!this.listeners("debug").length) return;
		this.emit("debug", message);
	}

	async createPlayer(guildId) {
		if (this.players.has(guildId)) return this.players.get(guildId);
		const player = createAudioPlayer();

		const state = {
			player,
			queue: [],
			connection: null,
			current: null,
			volume: 1.0,
			repeat: false,
			autoplay: false,
		};
		this.players.set(guildId, state);
		return state;
	}

	getPlayer(guildId) {
		return this.players.get(guildId) || null;
	}

	getQueue(guildId) {
		const state = this.players.get(guildId);
		return state?.queue || [];
	}

	async search(query, context = {}) {
		for (const extractor of this.extractors) {
			const type = this.guessQueryType(query);
			if (await extractor.validate(query, type)) {
				const ctx = {
					type,
					requestedBy: context.requestedBy,
					protocol: query.startsWith("http") ? "https" : "custom",
				};
				const result = await extractor.handle(query, ctx);
				if (result?.tracks?.length) {
					for (const t of result.tracks) {
						t.extractor = extractor;
						t.requestedBy = context.requestedBy;
						// t.metadata = context?.metadata || {};
					}
					return result.tracks;
				}
			}
		}
		return [];
	}

	async play(voiceChannel, tracks, options = {}) {
		const guildId = voiceChannel.guild.id;
		this.debug(
			`play() called for guildId: ${guildId}, tracks: ${Array.isArray(tracks) ? tracks.length : 1}, options: ${JSON.stringify(
				options,
			)}`,
		);
		const state = await this.createPlayer(guildId);

		const connection =
			getVoiceConnection(guildId) ||
			joinVoiceChannel({
				channelId: voiceChannel.id,
				guildId,
				adapterCreator: voiceChannel.guild.voiceAdapterCreator,
				selfDeaf: options.selfDeaf ?? true,
			});

		connection.subscribe(state.player);
		await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
		state.connection = connection;

		state.options = options;
		state.volume = (options.volume ?? 100) / 100;

		// const list = tracks.playlist ? tracks : [tracks?.[0]];
		const list = Array.isArray(tracks) ? tracks : [tracks];

		// console.log(list);
		for (const t of list) {
			state.queue.push(t);
		}

		state.player.on(AudioPlayerStatus.Idle, () => this.processQueue(guildId));
		state.player.on(AudioPlayerStatus.Playing, () => {
			if (state.current?.metadata) {
				this.emit("trackStart", guildId, state.current.metadata);
			}
		});
		state.player.on("error", (err) => this.emit("error", guildId, err));

		if (state.player.state.status === AudioPlayerStatus.Idle) {
			this.processQueue(guildId);
		}
	}

	async processQueue(guildId) {
		this.debug(`processQueue() called for guildId: ${guildId}`);
		const state = this.players.get(guildId);
		if (!state) return;

		const track = state.repeat && state.current?.metadata ? state.current.metadata : state.queue.shift();
		// console.log(track);

		if (!track) {
			this.debug(`Queue ended for guildId: ${guildId}`);
			this.emit("queueEnd", guildId);
			return;
		}

		try {
			this.debug(`Streaming track for guildId: ${guildId}, track: ${track.title || track.url}`);
			const stream = await track.extractor.stream(track);

			console.log(stream);
			const resource = createAudioResource(stream, {
				inputType: StreamType.Arbitrary,
				// metadata: track,
			});

			resource.volume?.setVolume(state.volume);
			state.current = resource;
			state.player.play(resource);
		} catch (error) {
			this.debug(`Error in processQueue for guildId: ${guildId}: ${error}`);
			this.emit("error", guildId, error);
		}
	}

	pause(guildId) {
		this.debug(`pause() called for guildId: ${guildId}`);
		const state = this.players.get(guildId);
		return state?.player.pause(true);
	}

	resume(guildId) {
		this.debug(`resume() called for guildId: ${guildId}`);
		const state = this.players.get(guildId);
		return state?.player.unpause();
	}

	skip(guildId) {
		this.debug(`skip() called for guildId: ${guildId}`);
		const state = this.players.get(guildId);
		state?.player.stop();
	}

	stop(guildId) {
		this.debug(`stop() called for guildId: ${guildId}`);
		const state = this.players.get(guildId);
		if (state) {
			state.queue = [];
			state.player.stop(true);
			this.emit("queueEnd", guildId);
		}
	}

	setVolume(guildId, vol) {
		const state = this.players.get(guildId);
		if (!state || vol < 0 || vol > 2) return;
		state.volume = vol;
		if (state.current?.volume) {
			state.current.volume.setVolume(vol);
		}
	}

	toggleRepeat(guildId) {
		const state = this.players.get(guildId);
		if (!state) return false;
		state.repeat = !state.repeat;
		return state.repeat;
	}

	nowPlaying(guildId) {
		const state = this.players.get(guildId);
		return state?.current?.metadata || null;
	}

	async resolve(query, requestedBy) {
		for (const extractor of this.extractors) {
			const type = this.guessQueryType(query);
			if (await extractor.validate(query, type)) {
				const ctx = {
					type,
					requestedBy,
					protocol: query.startsWith("http") ? "https" : "custom",
				};
				const result = await extractor.handle(query, ctx);

				if (result?.tracks?.length) {
					for (const t of result.tracks) {
						t.extractor = extractor;
					}
					return result.tracks;
				}
			}
		}
		return [];
	}

	guessQueryType(query) {
		if (query.includes("youtube.com") || query.includes("youtu.be")) return QueryType.YOUTUBE;
		if (query.includes("soundcloud.com")) return QueryType.SOUNDCLOUD;
		return QueryType.AUTO;
	}
}

module.exports = PlayerManager;
