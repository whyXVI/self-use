import * as crypto from 'node:crypto';
import { Zstd } from '@hpcc-js/wasm';

// --- Constants ---
const SALT = Buffer.from("my-blog-easter-egg");
const NONCE_SIZE = 12;
const KEY_SIZE = 32;
const AUTH_TAG_SIZE = 16;
const ZSTD_LEVEL = 19;
const HKDF_INFO = Buffer.from('blog-encryption');
const DIGEST = 'sha256';

/**
 * 从环境变量 ENCRYPTION_PASSWORD 派生 256 位密钥。
 * Derives a 256-bit key from the ENCRYPTION_PASSWORD environment variable using HKDF.
 * @throws {Error} 如果 ENCRYPTION_PASSWORD 环境变量未设置。
 */
function deriveKey(): Promise<Buffer> {
    const password = process.env.ENCRYPTION_PASSWORD;
    if (!password) {
        throw new Error("Environment variable ENCRYPTION_PASSWORD is not set.");
    }

    return new Promise((resolve, reject) => {
        crypto.hkdf(
            DIGEST,
            password,
            SALT,
            HKDF_INFO,
            KEY_SIZE,
            (err, derivedKey) => {
                if (err) return reject(err);
                resolve(Buffer.from(derivedKey));
            }
        );
    });
}

/**
 * 使用 zstd 压缩数据。
 * Compresses data using zstd.
 */
async function compress(data: Buffer, level: number = ZSTD_LEVEL): Promise<Buffer> {
    const zstd = await Zstd.load();
    const compressedData = zstd.compress(data, level);
    return Buffer.from(compressedData);
}

/**
 * 解压缩 zstd 数据。
 * Decompresses zstd data.
 */
async function decompress(data: Buffer): Promise<Buffer> {
    const zstd = await Zstd.load();
    const decompressedData = zstd.decompress(data);
    return Buffer.from(decompressedData);
}

/**
 * 加密参数。
 * Data flow: Object → JSON → UTF-8 → zstd → AES-GCM → Base64URL
 * @param params - 要加密的参数对象。
 * @param compressLevel - Zstandard 压缩级别。
 * @returns {Promise<string>} Base64URL 编码的加密字符串。
 */
export async function encrypt(params: Record<string, any>, compressLevel: number = ZSTD_LEVEL): Promise<string> {
    const plaintext = Buffer.from(JSON.stringify(params), 'utf-8');
    const compressed = await compress(plaintext, compressLevel);
    const key = await deriveKey();
    const nonce = crypto.randomBytes(NONCE_SIZE);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
    const ciphertext = Buffer.concat([cipher.update(compressed), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const payload = Buffer.concat([nonce, ciphertext, authTag]);
    return payload.toString('base64url');
}

/**
 * 解密字符串。
 * Data flow: Base64URL → AES-GCM → zstd → UTF-8 → JSON
 * @param encryptedString - Base64URL 编码的加密字符串。
 * @returns {Promise<Record<string, any>>} 解密后的参数对象。
 * @throws {Error} 如果解密失败 (例如，密码错误或数据损坏)。
 */
export async function decrypt(encryptedString: string): Promise<Record<string, any>> {
    try {
        const payload = Buffer.from(encryptedString, 'base64url');
        const nonce = payload.subarray(0, NONCE_SIZE);
        const authTag = payload.subarray(payload.length - AUTH_TAG_SIZE);
        const ciphertext = payload.subarray(NONCE_SIZE, payload.length - AUTH_TAG_SIZE);
        const key = await deriveKey();
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
        decipher.setAuthTag(authTag);
        const compressed = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
        const plaintext = await decompress(compressed);
        return JSON.parse(plaintext.toString('utf-8'));
    } catch (error: any) {
        // 捕获底层错误 (如 'Unsupported state' 或 'Invalid auth tag') 并包装成更通用的消息
        throw new Error(`Decryption failed. This could be due to an incorrect password or corrupted data. Original error: ${error.message}`);
    }
}