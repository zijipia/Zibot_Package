const query = "https://soundcloud.com/kydzz/amee-ung-qua-chung";

const SoundCloud = require("@zibot/scdl");

const youtubedl = require("youtube-dl-exec");
const fs = require("fs");

(async () => {
	try {
		const ZSoundCloud = new SoundCloud({ init: true });
		await ZSoundCloud.init();

		const result = await ZSoundCloud.downloadTrack(query, {});

		result.pipe(fs.createWriteStream("track.mp3"));

		// console.log(result);
		// fs.writeFileSync("videoDetails.json", JSON.stringify(result, null, 2));

		// console.log("Video Title:", result.title);
		// console.log("Video URL:", result.requested_downloads[0].requested_formats[0].url);
		// console.log("Duration (seconds):", result.duration);
		// console.log("Thumbnail URL:", result.thumbnail);
	} catch (error) {
		console.error("Error fetching video details:", error);
	}
})();
