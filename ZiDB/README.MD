# @zibot/db

@zibot/db là một thư viện đơn giản để quản lý cơ sở dữ liệu JSON dưới dạng file, giúp lưu trữ dữ liệu mà không cần sử dụng hệ quản
trị cơ sở dữ liệu phức tạp.

## Cài đặt

```sh
npm install @zibot/db
```

## Sử dụng

### Khởi tạo Database

```javascript
const { Database, createModel } = require("@zibot/db");

const db = new Database("./data.json");
const users = createModel(db, "users");
```

### Lưu tài liệu (document)

```javascript
await users.save({ name: "Alice" });
```

### Tìm một tài liệu

```javascript
const user = await users.findOne({ name: "Alice" });
console.log(user);
```

### Cập nhật một tài liệu

```javascript
await users.updateOne({ name: "Alice" }, { age: 25 });
```

### Xóa một tài liệu

```javascript
await users.deleteOne({ name: "Alice" });
```

### Tìm nhiều tài liệu

```javascript
const results = await users.find({ age: 25 });
console.log(results);
```

## API

### `class Database`

#### `new Database(dbPath?: string)`

Tạo một instance mới của Database với đường dẫn tệp JSON tùy chỉnh.

#### `async findOne(collection: string, query: object): Promise<object | null>`

Tìm một tài liệu trong collection theo query.

#### `async save(collection: string, document: object): Promise<object>`

Lưu một tài liệu mới vào collection.

#### `async updateOne(collection: string, query: object, update: object): Promise<{ modifiedCount: number }>`

Cập nhật một tài liệu khớp với query.

#### `async deleteOne(collection: string, query: object): Promise<{ deletedCount: number }>`

Xóa một tài liệu khớp với query.

#### `async find(collection: string, query: object): Promise<object[]>`

Tìm nhiều tài liệu trong collection theo query.

### `createModel(db: Database, name: string): Model`

Tạo một model đại diện cho collection trong Database.


## Giấy phép

MIT
