# Zihooks

Zihooks là một module JavaScript cho phép bạn tạo và quản lý các singleton cho các chức năng, lệnh, thời gian chờ và client trong
ứng dụng của bạn.

## Cài đặt

Để cài đặt module này, bạn có thể sử dụng npm hoặc yarn:

```bash
npm install @zibot/zihooks
```

hoặc

```bash
yarn add @zibot/zihooks
```

## Sử dụng

Dưới đây là cách bạn có thể sử dụng các hàm được cung cấp bởi module này:

### useFunctions

```javascript
const { useFunctions } = require("@zibot/zihooks");
const functionsInstance = useFunctions(myFunctions);
// Lần gọi đầu tiên yêu cầu một đối tượng Functions
```

### useCommands

```javascript
const { useCommands } = require("@zibot/zihooks");
const commandsInstance = useCommands(myCommands);
// Lần gọi đầu tiên yêu cầu một đối tượng Commands
```

### useCooldowns

```javascript
const { useCooldowns } = require("@zibot/zihooks");
const cooldownsInstance = useCooldowns(myCooldowns);
// Lần gọi đầu tiên yêu cầu một đối tượng Cooldowns
```

### useClient

```javascript
const { useClient } = require("@zibot/zihooks");
const clientInstance = useClient(myClient);
// Lần gọi đầu tiên yêu cầu một đối tượng Client
```

## Lưu ý

- Mỗi hàm chỉ cần được khởi tạo một lần với đối tượng tương ứng. Nếu bạn cố gắng gọi hàm mà không cung cấp đối tượng trong lần đầu
  tiên, một lỗi sẽ được ném ra.
- Sau khi khởi tạo, các lần gọi tiếp theo sẽ trả về instance đã được khởi tạo trước đó.

## Đóng góp

Nếu bạn muốn đóng góp cho dự án này, vui lòng tạo một pull request hoặc mở một issue trên GitHub.

## Giấy phép

Dự án này được cấp phép theo giấy phép MIT. Xem file [LICENSE](LICENSE) để biết thêm chi tiết.
