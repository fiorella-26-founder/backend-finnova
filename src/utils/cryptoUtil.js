const crypto = require('crypto');

const CRYPTO_SECRET_KEY = process.env.PASSWORD_CRYPTO_KEY || 'FinnovaSecureKey2026AES256Pass!!';

const cryptoUtil = {
    /**
     * Desencripta una contraseña enviada desde el cliente en formato AES-256-CBC (ENC:iv_hex:cipher_hex)
     * Si no viene encriptada, la retorna tal cual (fallback seguro).
     */
    desencriptarContrasena(texto) {
        if (!texto || typeof texto !== 'string') return texto;

        // Verificar si la contraseña tiene el prefijo de cifrado
        if (!texto.startsWith('ENC:')) {
            return texto;
        }

        try {
            const rawCipher = texto.substring(4);
            const parts = rawCipher.split(':');
            if (parts.length !== 2) return texto;

            const iv = Buffer.from(parts[0], 'hex');
            const encryptedData = Buffer.from(parts[1], 'hex');
            const keyBuffer = Buffer.from(CRYPTO_SECRET_KEY.padEnd(32, '0').slice(0, 32));

            const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
            let decrypted = decipher.update(encryptedData);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return decrypted.toString('utf8');
        } catch (error) {
            console.error('[CRYPTO] Error al desencriptar contraseña recibida:', error.message);
            return texto;
        }
    },

    /**
     * Encripta una contraseña en formato compatible AES-256-CBC
     */
    encriptarContrasena(textoPlano) {
        if (!textoPlano || typeof textoPlano !== 'string') return textoPlano;
        try {
            const iv = crypto.randomBytes(16);
            const keyBuffer = Buffer.from(CRYPTO_SECRET_KEY.padEnd(32, '0').slice(0, 32));
            const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
            let encrypted = cipher.update(textoPlano, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return `ENC:${iv.toString('hex')}:${encrypted}`;
        } catch (error) {
            console.error('[CRYPTO] Error al encriptar contraseña:', error.message);
            return textoPlano;
        }
    },

    /**
     * Genera una contraseña aleatoria segura y amigable (alfanumérica con mayúsculas, minúsculas, números y símbolo)
     */
    generarPasswordAleatoria(longitud = 8) {
        const mayusculas = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const minusculas = 'abcdefghijkmnopqrstuvwxyz';
        const numeros = '23456789';
        const especiales = '#@!%';
        const todos = mayusculas + minusculas + numeros + especiales;

        let pass = '';
        pass += mayusculas[crypto.randomInt(0, mayusculas.length)];
        pass += minusculas[crypto.randomInt(0, minusculas.length)];
        pass += numeros[crypto.randomInt(0, numeros.length)];
        pass += especiales[crypto.randomInt(0, especiales.length)];

        for (let i = 4; i < longitud; i++) {
            pass += todos[crypto.randomInt(0, todos.length)];
        }

        // Mezclar aleatoriamente los caracteres
        return pass.split('').sort(() => 0.5 - Math.random()).join('');
    }
};

module.exports = cryptoUtil;