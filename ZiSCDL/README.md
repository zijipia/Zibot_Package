# @zibot/scdl

@zibot/scdl là một module JavaScript hỗ trợ tải, tìm kiếm, và quản lý dữ liệu từ SoundCloud thông qua API. Module này cung cấp các
phương thức tiện lợi để xử lý track, playlist, và tải nội dung.

## Cài đặt

Bạn có thể cài đặt module này bằng npm hoặc yarn:

```bash
npm install @zibot/scdl
```

hoặc

```bash
yarn add @zibot/scdl
```

## Sử dụng

### Khởi tạo

Đầu tiên, bạn cần khởi tạo lớp `SoundCloud` để sử dụng các chức năng của module:

```javascript
const { SoundCloud } = require("@zibot/scdl");

(async () => {
	const scdl = new SoundCloud({ init: true }); // Tự động lấy client ID
	await scdl.init(); // Đảm bảo client ID được khởi tạo
})();
```

---

### Các phương thức

#### **`searchTracks(options)`**

Tìm kiếm các track trên SoundCloud.

```javascript
const tracks = await scdl.searchTracks({ query: "chill", limit: 5 });
console.log(tracks);
```

**Tham số:**

- `query` (bắt buộc): Từ khóa để tìm kiếm.
- `limit` (mặc định: `20`): Số lượng track tối đa.
- `offset` (mặc định: `0`): Vị trí bắt đầu.

---

#### **`getTrack(url)`**

Lấy thông tin chi tiết về một track.

```javascript
const track = await scdl.getTrack("https://soundcloud.com/user/song");
console.log(track);
```

**Tham số:**

- `url` (bắt buộc): URL của track.

---

#### **`getPlaylist(url)`**

Lấy thông tin chi tiết về một playlist.

```javascript
const playlist = await scdl.getPlaylist("https://soundcloud.com/user/playlist");
console.log(playlist);
```

**Tham số:**

- `url` (bắt buộc): URL của playlist.

---

#### **`downloadTrack(url, options)`**

Tải một track từ SoundCloud.

```javascript
const stream = await scdl.downloadTrack("https://soundcloud.com/user/song");
stream.pipe(fs.createWriteStream("track.mp3"));
```

**Tham số:**

- `url` (bắt buộc): URL của track.
- `options` (tùy chọn): Cấu hình tải xuống.

---

### Lưu ý

- Trước khi sử dụng các phương thức như `searchTracks`, `getTrack`, hoặc `downloadTrack`, cần đảm bảo rằng phương thức `init()` đã
  hoàn thành để lấy `clientId`.
- Nếu `clientId` không được khởi tạo, các phương thức này sẽ ném lỗi.

---

## Đóng góp

Nếu bạn muốn đóng góp cho dự án này, vui lòng tạo một pull request hoặc mở một issue trên GitHub.

---

## Giấy phép

Dự án này được cấp phép theo giấy phép MIT. Xem file [LICENSE](LICENSE) để biết thêm chi tiết.
