import { Readable } from "stream";

// Types
export interface SearchOptions {
	query: string;
	limit?: number;
	offset?: number;
	type?: "all" | "tracks" | "playlists" | "users";
}

export interface DownloadOptions {
	quality?: "high" | "low";
}

export interface Track {
	id: number;
	title: string;
	url: string;
	user: { id: number; username: string };
	media: {
		transcodings: {
			url: string;
			format: { protocol: string; mime_type: string };
		}[];
	};
}

export interface Playlist {
	id: number;
	title: string;
	tracks: Track[];
}

export interface User {
	id: number;
	username: string;
	followers_count: number;
	track_count: number;
}

declare class SoundCloud {
	clientId: string | null;
	apiBaseUrl: string;

	constructor(options?: { init?: boolean });

	/**
	 * Initialize the SoundCloud client to retrieve clientId.
	 */
	init(): Promise<void>;

	/**
	 * Search for tracks, playlists, or users on SoundCloud.
	 */
	searchTracks(options: SearchOptions): Promise<(Track | Playlist | User)[]>;

	/**
	 * Retrieve detailed information about a single track.
	 */
	getTrackDetails(url: string): Promise<Track>;

	/**
	 * Retrieve detailed information about a playlist.
	 */
	getPlaylistDetails(url: string): Promise<Playlist>;

	/**
	 * Download a track as a stream.
	 */
	downloadTrack(url: string, options?: DownloadOptions): Promise<Readable>;

	/**
	 * Get related tracks for a given track (by URL or ID).
	 */
	getRelatedTracks(track: string | number, opts?: { limit?: number; offset?: number }): Promise<Track[]>;
}

export = SoundCloud;
