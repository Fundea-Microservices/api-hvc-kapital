import * as crypto from 'crypto';

/**
 * HMAC-SHA256 determinista del PIN de autorización.
 *
 * A diferencia de bcrypt (salt aleatorio → el mismo PIN produce hashes distintos
 * y obliga a comparar fila por fila), HMAC con una llave fija genera siempre el
 * mismo digest. Eso permite un findOne por índice único, sin recorrer usuarios.
 *
 * El frontend sigue enviando el PIN en claro; solo se persiste y se consulta el digest.
 */
export function hashAuthCode(
  plainAuthCode: string,
  secret: string | undefined = process.env.AUTH_CODE_SECRET,
): string {
  if (!secret) {
    throw new Error('AUTH_CODE_SECRET no está definido en las variables de entorno');
  }

  return crypto
    .createHmac('sha256', secret)
    .update(plainAuthCode.trim())
    .digest('hex');
}
