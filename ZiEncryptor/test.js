const Encryptor = require("./");

// Khởi tạo Encryptor với mật khẩu
const myEncryptor = new Encryptor("super_secret_password");

// Dữ liệu cần mã hóa
const myObject = { name: "Ziji", project: "Encryption Library", year: 2024 };

// Mã hóa object
const encryptedString = myEncryptor.encrypt(myObject);
console.log("Encrypted String:", encryptedString);

// Giải mã string
try {
	const decryptedObject = myEncryptor.decrypt(encryptedString);
	console.log("Decrypted Object:", decryptedObject);
} catch (error) {
	console.error("Decryption Error:", error.message);
}
