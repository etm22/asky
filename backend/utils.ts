import fs from 'fs/promises';
import crypto from 'crypto';

export async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateRandomString(size: number): string {
	return crypto
		.randomBytes(Math.ceil(size / 2))
		.toString('hex') // convert to hexadecimal format
		.slice(0, size); // return required number of characters
}

export async function getFileSize(filePath): Promise<number> {
	try {
		let stats = await fs.stat(filePath);
		let fileSizeInBytes = stats.size;
		return fileSizeInBytes;
	} catch (err) {
		console.error(err);
		return 0;
	}
}

export function getUserAgent(): string {
	return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
}
