# Instalación en Windows y macOS

## 1. Preparar el equipo

Instala **Node.js 24 o posterior** desde su sitio oficial. npm se incluye con Node.js. Git es opcional si descargas el ZIP desde GitHub.

Comprueba la instalación en PowerShell (Windows) o Terminal (macOS):

```bash
node --version
npm --version
```

## 2. Obtener el proyecto

En GitHub, abre el repositorio y selecciona **Code → Download ZIP**. Descomprime el archivo y abre una terminal dentro de la carpeta que contiene `package.json`.

Si prefieres Git, clona el repositorio público:

```bash
git clone https://github.com/moises382/documentacion-red-institucional.git
cd documentacion-red-institucional
```

## 3. Instalar y ejecutar

```bash
npm ci
npm run seed:demo
npm run dev
```

Abre **http://127.0.0.1:3000** en el navegador. Deja la terminal abierta mientras uses la aplicación. Para detenerla, presiona `Ctrl+C`.

El script de ejemplo es opcional. Si quieres un inventario vacío, ejecuta únicamente `npm ci` y `npm run dev`.

### Windows

En el Explorador de archivos, entra a la carpeta del proyecto, haz clic en la barra de direcciones, escribe `powershell` y presiona Enter. Después ejecuta los comandos anteriores.

### macOS

Abre Terminal, escribe `cd ` (con un espacio al final), arrastra la carpeta del proyecto a la ventana y presiona Enter. Después ejecuta los comandos anteriores.

## 4. Comprobar el proyecto

```bash
npm run typecheck
npm test
npm run build
```

## Dónde quedan los datos

La primera ejecución crea `data/network.sqlite` dentro del proyecto. Git ignora esa carpeta, así que los datos locales no se suben al repositorio. `npm run seed:demo` no modifica una base que ya tiene registros.

## Idiomas y credenciales

En la barra superior puedes elegir **Español**, **English** o **Português**. La elección se conserva en el navegador.

Para guardar un usuario o contraseña, entra en **Bóveda segura**, crea una frase maestra de al menos 14 caracteres y añade una credencial. Puedes vincularla a un teléfono IP u otro equipo. La aplicación cifra la credencial antes de enviarla al servidor local. Descarga un **respaldo cifrado** desde la misma pantalla y guarda el archivo y la frase maestra en lugares seguros. Para restaurarlo en otra instalación, abre la bóveda vacía, elige **Restaurar un respaldo** y escribe la frase usada para crearlo.

Si ya hay una bóveda, desbloquéala y usa **Integrar un respaldo cifrado** para añadir credenciales faltantes. Este archivo respalda las credenciales, no los registros del inventario. Para trasladar todo el inventario local, copia `data/network.sqlite` con la aplicación detenida. Consulta [SEGURIDAD.md](docs/SEGURIDAD.md).

## Problemas comunes

- **`node` no se reconoce:** instala Node.js y abre una terminal nueva.
- **El puerto 3000 está ocupado:** detén la otra aplicación que lo usa o ejecuta `npm run dev -- --port 3001` y abre el puerto indicado.
- **El inventario aparece vacío:** la base es nueva. Ejecuta `npm run seed:demo` con el servidor detenido o crea registros desde la interfaz.
- **No puedes abrirla desde otro equipo:** esta adaptación funciona en la computadora donde se ejecuta. La versión privada de Sites sigue alojada en la nube.
- **Olvidaste la frase maestra:** la aplicación no puede recuperarla. Necesitas la frase original para abrir la bóveda o el respaldo cifrado.
