"use strict";

const axios = require("axios");
const m3u8stream = require("m3u8stream");

class SoundCloud {
	/**
	 * @param {Object} options
	 * @param {boolean} [options.autoInit=true] - tự động lấy clientId
	 * @param {string}  [options.apiBaseUrl="https://api-v2.soundcloud.com"]
	 * @param {number}  [options.timeout=12_000]
	 * @param {(id:string)=>void} [options.onClientId] - callback khi lấy được clientId (để cache ngoài)
	 * @param {string}  [options.clientId] - nếu bạn đã có sẵn clientId hợp lệ
	 */
	constructor(options = {}) {
		const defaultOptions = {
			autoInit: true,
			apiBaseUrl: "https://api-v2.soundcloud.com",
			timeout: 12_000,
			onClientId: null,
			clientId: null,
		};
		this.opts = { ...defaultOptions, ...options };
		this.apiBaseUrl = this.opts.apiBaseUrl;
		this.clientId = this.opts.clientId || null;

		this.http = axios.create({
			timeout: this.opts.timeout,
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
				Accept: "application/json, text/javascript, */*; q=0.01",
				Referer: "https://soundcloud.com/",
			},
		});

		this._initPromise = null;
		if (this.opts.autoInit && !this.clientId) {
			this._initPromise = this.init();
		}
	}

	async ensureReady() {
		if (this.clientId) return;
		if (!this._initPromise) this._initPromise = this.init();
		await this._initPromise;
	}

	async _getJson(url, { retries = 3, retryOn = [429, 500, 502, 503, 504] } = {}) {
		let lastErr;
		for (let attempt = 0; attempt <= retries; attempt++) {
			try {
				const { data } = await this.http.get(url);
				return data;
			} catch (err) {
				lastErr = err;
				const status = err?.response?.status;
				const shouldRetry = retryOn.includes(status) || err.code === "ECONNABORTED";
				if (!shouldRetry || attempt === retries) break;
				const delay = 300 * 2 ** attempt + Math.floor(Math.random() * 150);
				await new Promise((r) => setTimeout(r, delay));
			}
		}
		throw lastErr;
	}

	async init() {
		if (this.clientId) return this.clientId;

		const regexes = [
			/client_id=([a-zA-Z0-9]{32})/g, // client_id=XXXXXXXX...
			/"client_id"\s*:\s*"([a-zA-Z0-9]{32})"/g, // "client_id":"XXXXXXXX..."
		];

		const homeHtml = await this._getJson("https://soundcloud.com").catch(() => null);
		const scriptUrls =
			(typeof homeHtml === "string"
				? (homeHtml.match(/<script[^>]+src="([^"]+)"/g) || []).map((t) => t.match(/src="([^"]+)"/)?.[1]).filter(Boolean)
				: []) || [];

		const candidates = [
			...scriptUrls.filter((u) => /sndcdn\.com|soundcloud\.com/.test(u)),
			"https://a-v2.sndcdn.com/assets/1-ff6b3.js",
			"https://a-v2.sndcdn.com/assets/2-ff6b3.js",
		];

		for (const url of candidates) {
			try {
				const res = await this.http.get(url, { responseType: "text" });
				const text = res.data || "";
				for (const re of regexes) {
					const m = re.exec(text);
					if (m && m[1]) {
						this.clientId = m[1];
						if (typeof this.opts.onClientId === "function") this.opts.onClientId(this.clientId);
						return this.clientId;
					}
				}
			} catch {}
		}

		throw new Error("Không thể lấy client_id từ SoundCloud");
	}

	async searchTracks({ query, limit = 30, offset = 0, type = "all" }) {
		await this.ensureReady();
		const path = type === "all" ? "" : `/${type}`;
		const url =
			`${this.apiBaseUrl}/search${path}` +
			`?q=${encodeURIComponent(query)}` +
			`&limit=${limit}&offset=${offset}` +
			`&access=playable&client_id=${this.clientId}`;
		try {
			const data = await this._getJson(url);
			const collection = Array.isArray(data?.collection) ? data.collection : [];
			return collection.filter((t) => t?.permalink_url && t?.title && t?.duration);
		} catch (e) {
			throw new Error("Search failed");
		}
	}

	async getTrackDetails(trackUrl) {
		await this.ensureReady();
		const item = await this.fetchItem(trackUrl);
		if (item?.kind !== "track") throw new Error("Invalid track URL");
		return item;
	}

	async getPlaylistDetails(playlistUrl) {
		await this.ensureReady();
		const playlist = await this.fetchItem(playlistUrl);
		if (playlist?.kind !== "playlist") throw new Error("Invalid playlist URL");

		const tracks = Array.isArray(playlist.tracks) ? playlist.tracks : [];
		const loaded = tracks.filter((t) => t?.title);
		const unloadedIds = tracks.filter((t) => !t?.title && t?.id).map((t) => t.id);

		if (unloadedIds.length) {
			const more = await this.fetchTracksByIds(unloadedIds);
			playlist.tracks = loaded.concat(more);
		} else {
			playlist.tracks = loaded;
		}
		return playlist;
	}

	async downloadTrack(trackUrl, options = {}) {
		await this.ensureReady();
		try {
			const track = await this.getTrackDetails(trackUrl);

			if (track?.policy === "BLOCK" || track?.state === "blocked") {
				throw new Error("Track bị chặn (policy/geo).");
			}
			if (track?.has_downloads === false && track?.streamable === false) {
				throw new Error("Track không cho phép stream.");
			}

			const transcoding = this._pickBestTranscoding(track);
			if (!transcoding) throw new Error("Không tìm thấy stream phù hợp.");

			const streamUrl = await this.getStreamUrl(transcoding.url);
			if (transcoding.format?.protocol === "hls") {
				return m3u8stream(streamUrl, {
					requestOptions: {
						headers: { "User-Agent": this.http.defaults.headers["User-Agent"] },
					},
					...options,
				});
			} else {
				const res = await this.http.get(streamUrl, { responseType: "stream" });
				return res.data;
			}
		} catch (e) {
			console.error("Failed to download track:", e?.message || e);
			return null;
		}
	}

	async fetchItem(itemUrl) {
		await this.ensureReady();
		const url = `${this.apiBaseUrl}/resolve?url=${encodeURIComponent(itemUrl)}&client_id=${this.clientId}`;
		try {
			return await this._getJson(url);
		} catch (e) {
			throw new Error("Failed to fetch item details");
		}
	}

	async fetchTracksByIds(trackIds) {
		await this.ensureReady();
		const ids = Array.from(new Set(trackIds.filter(Boolean)));
		if (!ids.length) return [];
		const chunkSize = 50;
		const chunks = [];
		for (let i = 0; i < ids.length; i += chunkSize) chunks.push(ids.slice(i, i + chunkSize));

		try {
			const results = await Promise.all(
				chunks.map(async (chunk) => {
					const url = `${this.apiBaseUrl}/tracks?ids=${chunk.join(",")}&client_id=${this.clientId}`;
					return await this._getJson(url);
				}),
			);
			return results.flat();
		} catch (error) {
			console.error("Failed to fetch tracks by IDs:", {
				clientId: this.clientId,
				status: error?.response?.status,
				error: error?.response?.data || error?.message,
			});
			throw new Error("Failed to fetch tracks by IDs");
		}
	}

	async getStreamUrl(transcodingUrl) {
		await this.ensureReady();
		const url = `${transcodingUrl}${transcodingUrl.includes("?") ? "&" : "?"}client_id=${this.clientId}`;
		try {
			const data = await this._getJson(url);
			if (!data?.url) throw new Error("No stream URL in response");
			return data.url;
		} catch (error) {
			if (error?.response?.status === 401 || error?.response?.status === 403) {
				this.clientId = null;
				this._initPromise = this.init();
				await this._initPromise;
				const retryUrl = `${transcodingUrl}${transcodingUrl.includes("?") ? "&" : "?"}client_id=${this.clientId}`;
				const data = await this._getJson(retryUrl);
				if (!data?.url) throw new Error("No stream URL in response (after refresh)");
				return data.url;
			}
			throw new Error("Failed to fetch stream URL");
		}
	}

	/** pick transcoding: HLS (opus > mp3), fallback progressive mp3 */
	_pickBestTranscoding(track) {
		const list = Array.isArray(track?.media?.transcodings) ? track.media.transcodings : [];
		if (!list.length) return null;

		const score = (t) => {
			const proto = t?.format?.protocol;
			const mime = t?.format?.mime_type || "";
			if (proto === "hls" && mime.includes("opus")) return 100;
			if (proto === "hls" && mime.includes("mpeg")) return 90;
			if (proto === "progressive" && mime.includes("mpeg")) return 70;
			return 10;
		};

		return [...list].sort((a, b) => score(b) - score(a))[0];
	}
	async _resolveTrackId(input) {
		await this.ensureReady();
		if (!input) throw new Error("Missing track identifier");
		if (typeof input === "number" || /^[0-9]+$/.test(String(input))) {
			return Number(input);
		}
		const item = await this.fetchItem(input);
		if (item?.kind !== "track" || !item?.id) {
			throw new Error("Cannot resolve track ID from input");
		}
		return item.id;
	}

	/**
	 * Lấy danh sách related tracks cho một track (URL hoặc ID)
	 * @param {string|number} track - track URL hoặc track ID
	 * @param {object} opts
	 * @param {number} [opts.limit=20]
	 * @param {number} [opts.offset=0]
	 * @returns {Promise<Array>} danh sách track tương tự
	 */
	async getRelatedTracks(track, { limit = 20, offset = 0 } = {}) {
		await this.ensureReady();
		const id = await this._resolveTrackId(track);

		const url = `${this.apiBaseUrl}/tracks/${id}/related` + `?limit=${limit}&offset=${offset}&client_id=${this.clientId}`;

		try {
			const data = await this._getJson(url);
			const collection = Array.isArray(data?.collection) ? data.collection : Array.isArray(data) ? data : [];
			return collection.filter((t) => t?.permalink_url && t?.title && t?.duration);
		} catch (e) {
			return [];
		}
	}
}

module.exports = SoundCloud;
