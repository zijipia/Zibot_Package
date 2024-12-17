const CryptoJS = require('crypto-js');

class Encryptor {
  constructor(password) {
    if (!password) {
      throw new Error('Password is required for encryption and decryption.');
    }
    this.password = password;
  }

  encrypt(object) {
    try {
      const jsonString = JSON.stringify(object);
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.password).toString();
      return encrypted;
    } catch (error) {
      throw new Error('Error encrypting data: ' + error.message);
    }
  }

  decrypt(encryptedString) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedString, this.password);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      if (!decryptedString) {
        throw new Error('Invalid password or corrupted data.');
      }
      return JSON.parse(decryptedString);
    } catch (error) {
      throw new Error('Error decrypting data: ' + error.message);
    }
  }
}

module.exports = Encryptor;
