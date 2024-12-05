const { BaseExtractor, QueryType, Track, Playlist, Util } = require("discord-player");
const { unfurl } = require("unfurl.js");
const YouTubeSR = require("youtube-sr");
const { SoundCloud } = require("scdl-core");

const MAX_RETRIES = 3;

async function getStream(query, extractor) {
	let retry = 0;
	const platform = detectPlatform(query.url);
	const handler = platformHandlers[platform] || platformHandlers.default;

	while (retry < MAX_RETRIES) {
		try {
			extractor.log(`Attempt #${retry + 1} for URL: ${query.url}`);
			const streamUrl = await handler(query.url, extractor);

			if (streamUrl) {
				extractor.log(`Stream URL found: ${streamUrl}`);
				return streamUrl;
			}

			extractor.log(`Stream not found on attempt #${retry + 1}`);
		} catch (error) {
			extractor.log(`Error in getStream: ${error.message}`);
			console.error(error);
		}
		retry++;
	}

	extractor.log("Failed to retrieve stream after max retries");
	return null;
}

const platformHandlers = {
	youtube: getYoutubeStream,
	soundcloud: getSoundcloudStream,
	default: async (url, extractor) => {
		extractor.log(`Unsupported platform for URL: ${url}`);
		return null;
	},
};

function detectPlatform(url) {
	const platformMap = {
		youtube: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)/,
		// facebook: /(?:https?:\/\/)?(?:www\.)?facebook\.com/,
		soundcloud: /(?:https?:\/\/)?(?:www\.)?soundcloud\.com/,
		// tiktok: /(?:https?:\/\/)?(?:www\.)?tiktok\.com/,
		twitch: /(?:https?:\/\/)?(?:www\.)?twitch\.tv/,
	};

	for (const [platform, regex] of Object.entries(platformMap)) {
		if (regex.test(url)) return platform;
	}
	return "default";
}

async function getYoutubeStream(url, extractor) {
	// TODO: Implement YouTube stream handling logic
	return "Stream link for YouTube not implemented";
}

async function getSoundcloudStream(url, extractor) {
	try {
		return SoundCloud.download(url, {
			highWaterMark: extractor?._options.highWaterMark || 1 << 25,
		});
	} catch (error) {
		console.error(`Error in getSoundcloudStream: ${error.message}`);
		return null;
	}
}

function isValidUrl(string) {
	try {
		new URL(string);
		return true;
	} catch (_) {
		return false;
	}
}

class ZiExtractor extends BaseExtractor {
	static identifier = "com.Ziji.discord-player.Zijiext";

	constructor(options) {
		super(options);
		this._stream = options.createStream || getStream;
		this._options = options;
	}
	protocols = ["https", "soundcloud", "youtube"];
	async activate() {
		await SoundCloud.connect();
	}

	async deactivate() {
		this.log("Deactivating ZiExtractor");
	}
	validate(query, type) {
		return typeof query === "string" && Object.values(QueryType).includes(type);
	}

	log(message) {
		this.context?.player?.debug(`[ZiExtractor] ${message}`);
	}

	emptyResponse() {
		this.log("Returning empty response");
		return { playlist: null, tracks: [] };
	}

	stream(info) {
		this.log(`Streaming info for: ${info.url}`);
		return this._stream(info, this);
	}

	async getRelatedTracks(track, history) {
		this.log(`Fetching related tracks for: ${track.url}`);
		try {
			if (detectPlatform(track.url) === "youtube") {
				let result = [];
				if (YouTubeSR.YouTube.validate(track.url, "VIDEO")) {
					this.log(`Fetching related videos for URL: "${track.url}"`);
					const video = await YouTubeSR.YouTube.getVideo(track.url);
					result = video?.videos || [];
				} else {
					const searchQuery = track.author && track.author !== "Unknown" ? track.author : track.title;
					this.log(`Searching related videos for: "${searchQuery}"`);
					result = await YouTubeSR.YouTube.search(searchQuery, { limit: 25, type: "video" });
				}
				const uniqueTracks = result.filter((video) => !history.tracks.some((track) => track.url === video.url));
				this.log(`Found ${uniqueTracks.length} unique related tracks for track: "${track?.title}"`);

				const tracks = uniqueTracks.map((video) => this.createYTTrack(video, { requestedBy: track.requestedBy }));
				return { playlist: null, tracks };
			}
			const results = await SoundCloud.search({ query: track.author, limit: 30, filter: "tracks" });

			if (!results || !results?.collection?.length) {
				return [];
			}
			const tracks = results.collection.filter(
				(track) => !!track?.permalink_url && !history.tracks.some((tracks) => tracks.url === track.permalink_url),
			);
			const res = tracks.slice(0, 20).map((track) => this.createSCTrack(track, { requestedBy: track.requestedBy }));
			return { playlist: null, tracks: res };
		} catch (error) {
			this.log(`Error in fetchRelatedVideos: ${error.message}`);
			return this.emptyResponse();
		}
	}

	async handle(query, context) {
		this.log(`Handling query: ${query}`);
		try {
			if (context.protocol === "https") query = `https:${query}`;
			if (
				[QueryType.YOUTUBE, QueryType.YOUTUBE_SEARCH, QueryType.YOUTUBE_PLAYLIST, QueryType.YOUTUBE_VIDEO].includes(
					context.type,
				) ||
				detectPlatform(query) === "youtube"
			) {
				query = query.replace(/(m(usic)?|gaming)\./, "");
				return await this.handleYouTubeQuery(query, context);
			}

			if (
				[QueryType.SOUNDCLOUD_PLAYLIST, QueryType.SOUNDCLOUD, QueryType.SOUNDCLOUD_SEARCH, QueryType.SOUNDCLOUD_TRACK].includes(
					context.type,
				) ||
				detectPlatform(query) === "soundcloud"
			) {
				return await this.handleSoundcloudQuery(query, context);
			}
			if (isValidUrl(query)) {
				return await this.handleNonYouTubeQuery(query, context);
			}

			return await this.fallbackToYouTubeSearch(query, context);
		} catch (error) {
			this.log(`Error handling query: ${error.message}`);
			return await this.fallbackToYouTubeSearch(query, context);
		}
	}

	//#region nan youtube
	async handleNonYouTubeQuery(query, context) {
		this.log(`Handling non-YouTube query: ${query}`);
		const data = await unfurl(query, { timeout: 1500 });
		const track = this.createTrack(data, query, context);
		if (!track) return this.fallbackToYouTubeSearch(query, context);
		return { playlist: null, tracks: [track] };
	}

	createTrack(data, query, context) {
		this.log(`Creating track for query: ${query}`);
		const { twitter_card, title, open_graph, author, description, oEmbed } = data ?? {};

		const getFirstValue = (...args) => args.find((arg) => arg != null) ?? "Unknown";

		return new Track(this.context.player, {
			title: getFirstValue(twitter_card?.title, title, open_graph?.title),
			author: getFirstValue(author, open_graph?.article?.author, oEmbed?.author_name),
			description: getFirstValue(description, open_graph?.description, twitter_card?.description),
			url: query,
			requestedBy: context?.requestedBy,
			thumbnail: getFirstValue(
				open_graph?.images?.[0]?.url,
				oEmbed?.thumbnails?.[0]?.url,
				twitter_card?.images?.[0]?.url,
				"https://raw.githubusercontent.com/zijipia/zijipia/main/Assets/image.png",
			),
			source: getFirstValue(open_graph?.site_name, oEmbed?.provider_name, twitter_card?.site, "ZiExt"),
			raw: data,
			queryType: context.type,
			metadata: data,
			async requestMetadata() {
				return data;
			},
		});
	}
	//#endregion
	//#region youtube
	async handleYouTubeQuery(query, context) {
		if (context.type === QueryType.YOUTUBE_PLAYLIST || query.includes("list=")) {
			this.log(`Handling YouTube playlist: ${query}`);
			return this.handlePlaylist(query, context);
		}

		if ([QueryType.YOUTUBE_VIDEO].includes(context.type) || YouTubeSR.YouTube.validate(query, "VIDEO")) {
			this.log(`Handling YouTube video: ${query}`);
			return this.handleVideo(query, context);
		}

		return await this.fallbackToYouTubeSearch(query, context);
	}

	async fallbackToYouTubeSearch(query, context) {
		this.log(`Falling back to YouTube search for query: ${query}`);
		const tracks = await this.searchYouTube(query, context);
		return tracks.length ? { playlist: null, tracks } : this.emptyResponse();
	}

	async searchYouTube(query, context = {}) {
		try {
			const results = await YouTubeSR.YouTube.search(query, {
				type: "video",
				safeSearch: context.requestOptions?.safeSearch,
				requestOptions: context.requestOptions,
			});

			if (!results || !results.length) {
				return [];
			}

			return results.map((video) => this.createYTTrack(video, context));
		} catch (error) {
			this.log(`Error in searchYouTube: ${error.message}`);
			return [];
		}
	}

	async handlePlaylist(query, context) {
		this.log(`Fetching playlist for query: "${query}"`);
		try {
			const playlistData = await YouTubeSR.YouTube.getPlaylist(query, {
				fetchAll: true,
				limit: context.requestOptions?.limit,
				requestOptions: context.requestOptions,
			});

			if (!playlistData) {
				this.log(`No playlist data found for query: "${query}"`);
				return this.handleVideo(query, context);
			}

			const playlist = new Playlist(this.context.player, {
				title: playlistData.title,
				thumbnail: playlistData.thumbnail?.displayThumbnailURL("maxresdefault"),
				description: playlistData.title || "",
				type: "playlist",
				source: "youtube",
				author: {
					name: playlistData.channel.name,
					url: playlistData.channel.url,
				},
				id: playlistData.id,
				url: playlistData.url,
				rawPlaylist: playlistData,
			});

			this.log(`Playlist "${playlist.title}" created with ${playlistData.videos.length} tracks.`);
			playlist.tracks = playlistData.videos.map((video) => this.createYTTrack(video, context, playlist));

			return { playlist, tracks: playlist.tracks };
		} catch (error) {
			this.log(`Error in handlePlaylist: ${error.message}`);
			return this.emptyResponse();
		}
	}

	async handleVideo(query, context) {
		this.log(`Handling video for query: "${query}"`);
		try {
			const videoId = query.match(/[a-zA-Z0-9-_]{11}/)?.[0];
			if (!videoId) {
				this.log(`Invalid video ID in query: "${query}"`);
				return this.emptyResponse();
			}
			let video = await YouTubeSR.YouTube.getVideo(`https://www.youtube.com/watch?v=${videoId}`, context.requestOptions);

			if (!video)
				video = await YouTubeSR.YouTube.searchOne(
					`https://www.youtube.com/watch?v=${videoId}`,
					"video",
					null,
					context.requestOptions,
				);

			if (!video) {
				this.log(`No video found for ID: "${videoId}"`);
				return this.emptyResponse();
			}

			const track = this.createYTTrack(video, context);
			return { playlist: null, tracks: [track] };
		} catch (error) {
			this.log(`Error in handleVideo: ${error.message}`);
			return this.emptyResponse();
		}
	}

	createYTTrack(video, context, playlist = null) {
		this.log(`Video: "${video?.title?.slice(0, 70)}..."`);
		return new Track(this.context.player, {
			title: video?.title || "Unknown Title",
			description: video?.description,
			author: video?.channel?.name,
			url: video?.url,
			requestedBy: context?.requestedBy,
			thumbnail: video.thumbnail?.displayThumbnailURL?.("maxresdefault") || video.thumbnail.url || video.thumbnail,
			views: video?.views,
			duration: video?.durationFormatted || Util.buildTimeCode(Util.parseMS(video.duration * 1e3)),
			source: "youtube",
			raw: video,
			queryType: "youtubeVideo",
			metadata: video,
			playlist,
			async requestMetadata() {
				return video;
			},
			live: video?.live,
		});
	}
	//#endregion
	//#region SoundCloud
	async handleSoundcloudQuery(query, context) {
		if (context.type === QueryType.SOUNDCLOUD_PLAYLIST || query.includes("sets")) {
			this.log(`Handling Soundcloud playlist: ${query}`);
			return this.handleSCPlaylist(query, context);
		}

		if ([QueryType.SOUNDCLOUD, QueryType.SOUNDCLOUD_SEARCH].includes(context.type) || query.includes("sets")) {
			this.log(`Handling Soundcloud Search: ${query}`);
			return this.searchSoundcloud(query, context);
		}

		this.log(`Handling Soundcloud Track: ${query}`);
		return this.handleSCVideo(query, context);
	}

	async searchSoundcloud(query, context = {}) {
		try {
			const results = await SoundCloud.search({ query, limit: 30, filter: "tracks" });

			if (!results || !results?.collection?.length) {
				return [];
			}
			const tracks = results.collection.filter((track) => !!track?.permalink_url);
			const res = tracks.slice(0, 20).map((track) => this.createSCTrack(track, context));
			return { playlist: null, tracks: res };
		} catch (error) {
			this.log(`Error in searchSoundcloud: ${error.message}`);
			return [];
		}
	}

	async handleSCVideo(query, context) {
		this.log(`Handling Track for query: "${query}"`);
		try {
			const tracks = await SoundCloud.tracks.getTrack(query);

			if (!tracks) {
				this.log(`No video found for ID: "${query}"`);
				return this.emptyResponse();
			}

			const track = this.createSCTrack(tracks, context);
			return { playlist: null, tracks: [track] };
		} catch (error) {
			this.log(`Error in handleSCVideo: ${error}`);
			return this.emptyResponse();
		}
	}

	async handleSCPlaylist(query, context) {
		this.log(`Fetching playlist for query: "${query}"`);
		try {
			const playlistData = await SoundCloud.playlists.getPlaylist(permalink);

			if (!playlistData) {
				this.log(`No playlist data found for query: "${query}"`);
				return this.handleSCVideo(query, context);
			}

			const playlist = new Playlist(this.context.player, {
				title: playlistData?.label_name || "",
				thumbnail: playlistData?.artwork_url || "",
				description: playlistData?.description || "",
				type: "playlist",
				source: "soundcloud",
				author: {
					name: playlistData.user.username,
					url: playlistData.user.uri,
				},
				id: playlistData.id,
				url: playlistData.uri,
				rawPlaylist: playlistData,
			});

			this.log(`Playlist "${playlist.title}" created with ${playlistData.videos.length} tracks.`);
			playlist.tracks = playlistData.tracks.map((track) => this.createSCTrack(track, context, playlist));

			return { playlist, tracks: playlist.tracks };
		} catch (error) {
			this.log(`Error in handlePlaylist: ${error.message}`);
			return this.emptyResponse();
		}
	}

	createSCTrack(track, context, playlist = null) {
		this.log(`Video: "${track?.title?.slice(0, 70)}..."`);
		return new Track(this.context.player, {
			title: track?.title || "Unknown Title",
			description: track?.description,
			author: track?.user?.username,
			url: track?.permalink_url,
			requestedBy: context?.requestedBy,
			thumbnail: track.artwork_url,
			duration: Util.buildTimeCode(Util.parseMS(track.duration)),
			source: "soundcloud",
			raw: track,
			queryType: "soundcloudTrack",
			metadata: track,
			playlist,
			async requestMetadata() {
				return track;
			},
		});
	}
	//#endregion
}

module.exports = { ZiExtractor };
