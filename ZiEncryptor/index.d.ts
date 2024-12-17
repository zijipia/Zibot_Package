declare class Encryptor {
	/**
	 * Creates an instance of Encryptor.
	 * @param password - A string password used for encryption and decryption.
	 * @throws Will throw an error if no password is provided.
	 */
	constructor(password: string);

	/**
	 * Encrypts an object into a string.
	 * @param object - The object to encrypt.
	 * @returns The encrypted string.
	 * @throws Will throw an error if encryption fails.
	 */
	encrypt(object: Record<string, any>): string;

	/**
	 * Decrypts an encrypted string back into an object.
	 * @param encryptedString - The string to decrypt.
	 * @returns The decrypted object.
	 * @throws Will throw an error if decryption fails.
	 */
	decrypt(encryptedString: string): Record<string, any>;
}
export = Encryptor;
