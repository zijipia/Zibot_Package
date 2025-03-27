interface TTSOptions {
	lang?: string;
	slow?: boolean;
}

/**
 * Chuyển văn bản thành danh sách URL của file âm thanh từ Google Translate
 * @param text - Văn bản cần chuyển thành giọng nói
 * @param options - Tùy chọn ngôn ngữ và tốc độ
 * @returns Mảng URL của file âm thanh
 */
export function getTTSUrls(text: string, options?: TTSOptions): string[];
