const FALLBACK_KEY = 'froggi';

function xorBytes(input: Uint8Array, keyBytes: Uint8Array): Uint8Array {
	const result = new Uint8Array(input.length);
	for (let i = 0; i < input.length; i++) {
		result[i] = input[i] ^ keyBytes[i % keyBytes.length];
	}
	return result;
}

export function encryptUrl(url: string, version: string): string {
	const key = version || FALLBACK_KEY;
	const urlBytes = new TextEncoder().encode(url);
	const keyBytes = new TextEncoder().encode(key);
	const xored = xorBytes(urlBytes, keyBytes);
	return btoa(String.fromCharCode(...xored))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}

export function decryptUrl(hash: string, version: string): string {
	const key = version || FALLBACK_KEY;
	const padded = hash.replace(/-/g, '+').replace(/_/g, '/');
	const pad = (4 - (padded.length % 4)) % 4;
	const bytes = Uint8Array.from(atob(padded + '='.repeat(pad)), (c) => c.charCodeAt(0));
	const keyBytes = new TextEncoder().encode(key);
	return new TextDecoder().decode(xorBytes(bytes, keyBytes));
}

export function isEncryptedHash(s: string): boolean {
	return !!s && !s.startsWith('http://') && !s.startsWith('https://');
}
