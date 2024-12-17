# Encryptor Library

A simple utility for encrypting and decrypting objects in JavaScript/Node.js using AES encryption.

## Features

- **Encrypt** JavaScript objects into secure strings.
- **Decrypt** encrypted strings back into objects.
- Uses AES encryption from the [crypto-js](https://www.npmjs.com/package/crypto-js) library.
- Easy-to-use interface.

---

## Installation

To install the library, use npm:

```bash
npm install @zibot/ziencryptor
```

---

## Usage

### Import the Library

#### Node.js

```javascript
const Encryptor = require("@zibot/ziencryptor");
```

### Example Code

```javascript
const Encryptor = require("@zibot/ziencryptor");

// Initialize the Encryptor with a password
const myEncryptor = new Encryptor("msuper_secret_password");

// Data to be encrypted
const data = { name: "Ziji", project: "Encryption Library", year: 2024 };

// Encrypt the object
const encryptedData = myEncryptor.encrypt(data);
console.log("Encrypted Data:", encryptedData);

// Decrypt the encrypted string
try {
	const decryptedData = myEncryptor.decrypt(encryptedData);
	console.log("Decrypted Data:", decryptedData);
} catch (error) {
	console.error("Decryption Error:", error.message);
}
```

---

## API Reference

### `new Encryptor(password: string)`

- **Description**: Initializes the `Encryptor` class with a given password.
- **Parameters**:
  - `password` (string): The encryption/decryption password.
- **Throws**: If no password is provided.

---

### `encrypt(object: Record<string, any>): string`

- **Description**: Encrypts a JavaScript object into a secure string.
- **Parameters**:
  - `object` (Record<string, any>): The object to encrypt.
- **Returns**: A string representing the encrypted data.
- **Throws**: If encryption fails.

---

### `decrypt(encryptedString: string): Record<string, any>`

- **Description**: Decrypts an encrypted string back into its original object.
- **Parameters**:
  - `encryptedString` (string): The string to decrypt.
- **Returns**: The decrypted object.
- **Throws**: If the password is incorrect or the data is corrupted.

---

## Output Example

```
Encrypted Data: U2FsdGVkX1+abcDEF12345678example==
Decrypted Data: { name: 'Ziji', project: 'Encryption Library', year: 2024 }
```

---

## License

This library is licensed under the MIT License.

---

## Author

Developed by **Ziji**. Contributions are welcome!
