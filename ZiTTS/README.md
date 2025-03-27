# @zibot/zitts - Google TTS (Text-to-Speech)

A simple package to convert text to speech using Google Translate and return a list of audio file URLs.

## 🚀 Installation

```sh
npm install @zibot/zitts
```

## 📌 Usage

```javascript
const { getTTSUrls } = require("@zibot/zitts");

const text = "Hello! This is a test text.";
const urls = getTTSUrls(text, { lang: "en" });

console.log(urls);
```

## 🌟 Features

- ✅ Convert text to speech (TTS)

- ✅ Supports multiple languages (English, Vietnamese, Japanese, etc.)

- ✅ Automatically splits sentences correctly

- ✅ Returns a list of audio file URLs

## ⚙️ API

```
getTTSUrls(text: string, options?: TTSOptions): string[]
```

Converts text into a list of audio file URLs.
Parameters:
|Name|Type|Default|Description|
|---|---|---|---|
|text|string|Required|The text to be converted to speech|
|options|TTSOptions|{ lang: "en",slow: false }|Language and speed options TTSOptions|

Structure:
|Property| Type| Description|
|---|---|---|
| lang| string| Language code (e.g., "vi" forVietnamese, "en" for English)|
| slow| boolean| If true, the speech will be slower (default is false)|

## 🛠 Advanced Example

```javascript
const { getTTSUrls } = require("@zibot/zitts");

(async () => {
	const text =
		"Hello there! This is a long paragraph exceeding 200 characters. Let's check if it correctly splits into multiple sentences.";
	const urls = getTTSUrls(text, { lang: "en", slow: true });

	console.log("Generated TTS URLs:", urls);
})();
```