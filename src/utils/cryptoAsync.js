

const bcrypt = require('bcryptjs');

/**
 * Compara contraseña en texto plano contra su hash Bcrypt de forma no bloqueante
 * @param {string} contrasenaPlana 
 * @param {string} hashAlmacenado 
 * @returns {Promise<boolean>}
 */
function compararPasswordAsync(contrasenaPlana, hashAlmacenado) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(contrasenaPlana, hashAlmacenado, (err, sonIguales) => {
      if (err) return reject(err);
      resolve(sonIguales);
    });
  });
}

/**
 * Genera hash seguro asíncrono con factor de coste regulado
 * @param {string} contrasenaPlana 
 * @param {number} rounds 
 * @returns {Promise<string>}
 */
function generarHashAsync(contrasenaPlana, rounds = 10) {
  return new Promise((resolve, reject) => {
    bcrypt.hash(contrasenaPlana, rounds, (err, hash) => {
      if (err) return reject(err);
      resolve(hash);
    });
  });
}

module.exports = {
  compararPasswordAsync,
  generarHashAsync
};
