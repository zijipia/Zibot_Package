const axios = require("axios");
const m3u8stream = require("m3u8stream");

class SoundCloud {
	constructor(options = {}) {
		const defaultOptions = { init: true, apiBaseUrl: "https://api-v2.soundcloud.com" };
		options = { ...defaultOptions, ...options };
		this.clientId = null;
		this.apiBaseUrl = options.apiBaseUrl;
		if (options.init) this.init();
	}

	// Auto-fetch Client ID
	async init() {
		const clientIdRegex = /client_id=(:?[\w\d]{32})/;
		const soundCloudDom = (await axios.get("https://soundcloud.com")).data;
		const scriptUrls = (soundCloudDom.match(/<script crossorigin src="(.*?)"><\/script>/g) || [])
			.map((tag) => tag.match(/src="(.*?)"/)?.[1])
			.filter(Boolean);

		for (const url of scriptUrls) {
			const response = await axios.get(url);
			const match = response.data.match(clientIdRegex);
			if (match) {
				this.clientId = match[1];
				return;
			}
		}

		throw new Error("Failed to fetch client ID");
	}

	// Search SoundCloud
	async searchTracks({ query, limit = 20, offset = 0, type = "all" }) {
		const path = type === "all" ? "" : `/${type}`;
		const url = `${this.apiBaseUrl}/search${path}?q=${encodeURIComponent(
			query,
		)}&limit=${limit}&offset=${offset}&access=playable&client_id=${this.clientId}`;
		console.log(url);
		try {
			const { data } = await axios.get(url);
			return data;
		} catch (error) {
			console.error("Search error:", error.message || error);
			throw new Error("Search failed");
		}
	}

	// Get track details
	async getTrackDetails(trackUrl) {
		try {
			return await this.fetchItem(trackUrl);
		} catch (error) {
			throw new Error("Invalid track URL");
		}
	}

	// Get playlist details
	async getPlaylistDetails(playlistUrl) {
		try {
			const playlist = await this.fetchItem(playlistUrl);
			const { tracks } = playlist;

			const loadedTracks = tracks.filter((track) => track.title);
			const unloadedTrackIds = tracks.filter((track) => !track.title).map((track) => track.id);

			if (unloadedTrackIds.length > 0) {
				const moreTracks = await this.fetchTracksByIds(unloadedTrackIds);
				playlist.tracks = loadedTracks.concat(moreTracks);
			}

			return playlist;
		} catch (error) {
			throw new Error("Invalid playlist URL");
		}
	}

	// Download track stream
	async downloadTrack(trackUrl, options = {}) {
		const track = await this.getTrackDetails(trackUrl);
		const transcoding = track.media.transcodings.find((t) => t.format.protocol === "hls");

		if (!transcoding) throw new Error("No valid HLS stream found");

		const m3u8Url = await this.getStreamUrl(transcoding.url);
		return m3u8stream(m3u8Url, options);
	}

	// Fetch single item (track/playlist/user)
	async fetchItem(itemUrl) {
		const url = `${this.apiBaseUrl}/resolve?url=${itemUrl}&client_id=${this.clientId}`;
		try {
			const { data } = await axios.get(url);
			return data;
		} catch (error) {
			throw new Error("Failed to fetch item details");
		}
	}

	// Fetch multiple tracks by their IDs
	async fetchTracksByIds(trackIds) {
		const ids = trackIds.join(",");
		const url = `${this.apiBaseUrl}/tracks?ids=${ids}&client_id=${this.clientId}`;
		try {
			const { data } = await axios.get(url);
			return data;
		} catch (error) {
			throw new Error("Failed to fetch tracks by IDs");
		}
	}

	// Get HLS stream URL
	async getStreamUrl(transcodingUrl) {
		const url = `${transcodingUrl}?client_id=${this.clientId}`;
		try {
			const { data } = await axios.get(url);
			return data.url;
		} catch (error) {
			throw new Error("Failed to fetch stream URL");
		}
	}
}

module.exports = SoundCloud;
