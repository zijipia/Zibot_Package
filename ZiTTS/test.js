const { getTTSUrls } = require("./index");

(async () => {
	const text = `Nhớ gì như nhớ người yêu
Trăng lên đầu núi, nắng chiều lưng nương
Nhớ từng bản khói cùng sương
Sớm khuya bếp lửa người thương đi về.
Nhớ từng rừng nứa bờ tre
Ngòi Thia, sông Đáy, suối Lê vơi đầy.
Ta đi ta nhớ những ngày
Mình đây ta đó, đắng cay ngọt bùi.`;
	const urls = await getTTSUrls(text, { lang: "vi" });
	console.log(urls);
})();
