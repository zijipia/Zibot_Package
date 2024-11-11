// const { Innertube, UniversalCache, Utils } = require("youtubei.js");
// const { existsSync, mkdirSync, createWriteStream } = require("fs");

// (async () => {
// 	const yt = await Innertube.create({ cache: new UniversalCache(false), generate_session_locally: true });

// 	const stream = await yt.download("5IvvVKW1ipo", {
// 		type: "audio", // audio, video or video+audio
// 		quality: "best", // best, bestefficiency, 144p, 240p, 480p, 720p and so on.
// 		format: "mp4", // media container format,
// 		client: "iOS",
// 	});

// 	console.info(`Downloading "ID-video"`);

// 	const dir = `./DOWN`;

// 	if (!existsSync(dir)) {
// 		mkdirSync(dir);
// 	}

// 	const file = createWriteStream(`${dir}/videos.m4a`);

// 	for await (const chunk of Utils.streamToIterable(stream)) {
// 		file.write(chunk);
// 	}

// 	console.info(`"ID-video" - Done!`, "\n");
// 	// }

// 	console.info(`Done!`);
// })();
console.log(1 << 7);
