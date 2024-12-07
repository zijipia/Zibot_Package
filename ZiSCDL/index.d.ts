import { Readable } from "stream";

// Types
interface SearchOptions {
	query: string;
	limit?: number;
	offset?: number;
	type?: "all" | "tracks" | "playlists" | "users";
}

interface DownloadOptions {
	quality?: "high" | "low";
}

interface Track {
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

interface Playlist {
	id: number;
	title: string;
	tracks: Track[];
}

interface User {
	id: number;
	username: string;
	followers_count: number;
	track_count: number;
}

interface SearchResponse {
	collection: (Track | Playlist | User)[];
	next_href?: string;
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
	searchTracks(options: SearchOptions): Promise<SearchResponse>;

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
}

export = SoundCloud;
