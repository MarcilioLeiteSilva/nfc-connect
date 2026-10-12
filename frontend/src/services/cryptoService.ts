/**
 * Serviço de Criptografia de Alta Segurança no Aparelho (AES-GCM 256-bit)
 * Utiliza a Web Crypto API nativa do navegador para garantir sigilo total
 * de vendas e dados gravados em cache/fila offline no celular.
 */

// Chave mestra baseada no ambiente seguro do PWA
const CRYPTO_SALT = new TextEncoder().encode('nfc_connect_comunicar_2026_salt_secure');

class CryptoService {
  private keyCache: Map<string, CryptoKey> = new Map();

  /**
   * Deriva uma chave criptográfica AES-GCM de 256 bits a partir de um segredo do usuário
   * usando PBKDF2 com 100.000 iterações e SHA-256 (Padrão Bancário / OWASP).
   */
  private async deriveKey(secret: string): Promise<CryptoKey> {
    if (this.keyCache.has(secret)) {
      return this.keyCache.get(secret)!;
    }

    if (!window.crypto || !window.crypto.subtle) {
      throw new Error('Web Crypto API não suportada neste navegador.');
    }

    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const derivedKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: CRYPTO_SALT,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    this.keyCache.set(secret, derivedKey);
    return derivedKey;
  }

  /**
   * Criptografa qualquer objeto ou dado em um payload seguro codificado em Base64
   * Formato de saída: [IV de 12 bytes] + [Ciphertext cifrado com AES-GCM + Tag de Autenticação]
   */
  public async encrypt<T>(data: T, secret: string): Promise<string> {
    try {
      const key = await this.deriveKey(secret);
      const jsonString = JSON.stringify(data);
      const encodedData = new TextEncoder().encode(jsonString);

      // IV aleatório único de 12 bytes para cada operação (recomendado para AES-GCM)
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        encodedData
      );

      // Combina IV + Buffer cifrado
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);

      // Converte para Base64 para armazenamento seguro em texto opaco
      return this.bufferToBase64(combined);
    } catch (err) {
      console.error('[CryptoService] Erro ao criptografar dados:', err);
      throw new Error('Falha na criptografia dos dados locais.');
    }
  }

  /**
   * Decifra o payload Base64 e valida a integridade dos dados via tag de autenticação AES-GCM
   */
  public async decrypt<T>(cipherBase64: string, secret: string): Promise<T> {
    try {
      const key = await this.deriveKey(secret);
      const combined = this.base64ToBuffer(cipherBase64);

      if (combined.length < 13) {
        throw new Error('Dados cifrados corrompidos ou inválidos.');
      }

      // Extrai o IV de 12 bytes e o ciphertext restante
      const iv = combined.slice(0, 12);
      const ciphertext = combined.slice(12);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        ciphertext
      );

      const decryptedString = new TextDecoder().decode(decryptedBuffer);
      return JSON.parse(decryptedString) as T;
    } catch (err) {
      console.error('[CryptoService] Erro ao decifrar dados:', err);
      throw new Error('Falha na decifração ou dados locais violados.');
    }
  }

  // Helpers de conversão Base64 / Uint8Array
  private bufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return window.btoa(binary);
  }

  private base64ToBuffer(base64: string): Uint8Array {
    const binary = window.atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

export const cryptoService = new CryptoService();
