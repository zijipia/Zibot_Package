// async function getStream(query, extractor) {
// 	extractor.log(`use [cobalt] getStream: ${query.url}`);
// 	try {
// 		const response = await fetch("https://api.cobalt.tools/api/json", {
// 			method: "POST",
// 			headers: {
// 				accept: "application/json",
// 				"content-type": "application/json",
// 			},
// 			body: JSON.stringify({ url: query.url, isAudioOnly: true }),
// 		});
// 		const data = await response.json();
// 		extractor.log(`use [cobalt] response: ${data}`);
// 		console.log(data);
// 		return data.url;
// 	} catch (error) {
// 		extractor.log(`Error in getStream: ${error.message}`);
// 		console.error(`Error in getStream: ${error.message}`);
// 		return null;
// 	}
// }
function isValidUrl(string) {
	try {
		new URL(string);
		return true;
	} catch (_) {
		return false;
	}
}
const query = "https://soundcloud.com/kydzz/amee-ung-qua-chung";
const { unfurl } = require("unfurl.js");
const { BaseExtractor, QueryType, Track, Playlist } = require("discord-player");

// (async () => {
// 	//

// 	//
// })();
console.log(isValidUrl(query));

// function createTrack(data, query) {
// 	const { twitter_card, title, open_graph, author, description, oEmbed } = data ?? {};

// 	const getFirstValue = (...args) => args.find((arg) => arg != null) ?? "Unknown";

// 	return new Track(null, {
// 		title: getFirstValue(twitter_card?.title, title, open_graph?.title),
// 		author: getFirstValue(author, open_graph?.article?.author, oEmbed?.author_name),
// 		description: getFirstValue(description, open_graph?.description, twitter_card?.description),
// 		url: query,
// 		requestedBy: "context?.requestedBy",
// 		thumbnail: getFirstValue(
// 			open_graph?.images?.[0]?.url,
// 			oEmbed?.thumbnails?.[0]?.url,
// 			twitter_card?.images?.[0]?.url,
// 			"https://raw.githubusercontent.com/zijipia/zijipia/main/Assets/image.png",
// 		),
// 		source: getFirstValue(open_graph?.site_name, oEmbed?.provider_name, twitter_card?.site, "ZiExt"),
// 		raw: data,
// 		queryType: "context.type",
// 		metadata: data,
// 		async requestMetadata() {
// 			return data;
// 		},
// 	});
// }
