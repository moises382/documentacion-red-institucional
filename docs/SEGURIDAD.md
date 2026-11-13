# Bóveda de credenciales y respaldos

La ficha normal de un equipo contiene datos técnicos y referencias. **Usuarios, contraseñas y notas privadas se guardan en Bóveda segura**, separada del inventario y del historial general. El repositorio público no incluye ninguna credencial ni base de datos.

## Cómo usarla

1. Abre **Bóveda segura** y crea una frase maestra larga y única de al menos 14 caracteres.
2. Añade una credencial. Puedes vincularla a un teléfono IP u otro equipo y elegir la sede.
3. Descarga un **respaldo cifrado** después de añadir o actualizar credenciales. Guarda el archivo fuera de GitHub y conserva la frase maestra en un lugar seguro distinto.
4. Para restaurar una bóveda vacía, carga el respaldo y escribe su frase maestra. Si ya hay una bóveda, desbloquéala y usa **Integrar respaldo** para combinar las entradas.

La bóveda se bloquea después de diez minutos sin actividad en esa pantalla. También puedes bloquearla manualmente. El botón de respaldo descarga un archivo JSON cifrado; no es un CSV ni contiene contraseñas legibles.

## Cómo funciona

- El navegador deriva una clave con **PBKDF2-HMAC-SHA-256, 600 000 iteraciones** y una sal aleatoria de 16 bytes.
- El documento privado se cifra con **AES-256-GCM** y un vector aleatorio nuevo de 12 bytes en cada guardado. GCM detecta cambios en el contenido cifrado.
- La API recibe y almacena únicamente la sal, los parámetros de derivación, el vector y el texto cifrado. La frase maestra y el documento abierto permanecen en la memoria del navegador mientras la bóveda está desbloqueada.
- El respaldo contiene ese mismo sobre cifrado. La importación comprueba que la frase lo abre antes de restaurarlo o integrarlo.
- En la versión personal, SQLite conserva la bóveda en `data/network.sqlite`. En Sites, la bóveda queda asociada al usuario autenticado; el acceso al sitio continúa privado.

## Límites importantes

- **No hay recuperación de la frase maestra.** El respaldo cifrado también requiere la frase con la que fue creado.
- El respaldo de la bóveda contiene credenciales y su historial privado, **no** el inventario, reportes ni topología. En la edición local, copia `data/network.sqlite` con el servidor detenido para respaldar también esos registros.
- Una frase débil facilita ataques contra una copia robada del archivo cifrado. Usa una frase larga y única.
- El cifrado en el navegador no protege frente a un navegador o equipo comprometido, ni frente a código malicioso servido a una sesión desbloqueada. Mantén el equipo y el navegador actualizados y limita quién puede modificar el despliegue.
- La edición personal se ejecuta solo en `127.0.0.1` y no tiene cuentas. Su código puede mostrarse en GitHub; **no publiques la base de datos, los archivos de respaldo ni credenciales reales**.

El cifrado y la derivación siguen las recomendaciones de [OWASP para almacenamiento criptográfico](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html), [OWASP para PBKDF2](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) y la [API Web Crypto documentada por MDN](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey).
