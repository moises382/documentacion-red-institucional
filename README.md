# Documentación de red institucional

Aplicación web en español para organizar el inventario y el seguimiento de un proyecto de documentación de red. Esta es la **versión personal de portafolio**: funciona en tu computadora con SQLite y puede cargarse con registros ficticios. No contiene información de una red institucional real.

Repositorio público: [moises382/documentacion-red-institucional](https://github.com/moises382/documentacion-red-institucional).

## Funciones

- Inventario editable de equipos, direcciones IP, puertos, VLANs, etiquetas de nodos y cables, racks, patch panels, enlaces troncales y dispositivos PoE.
- Plantillas reutilizables para switches, computadoras, laptops, impresoras, puntos de acceso, teléfonos IP, servidores, routers, firewalls, cámaras IP, UPS y NAS.
- Estado de uso independiente de la verificación: **activo**, **inactivo**, **no utilizado** o **por confirmar**, con motivo y filtro en el inventario.
- Diagrama de topología generado a partir de equipos y conexiones documentadas.
- Pendientes, inconsistencias automáticas por IP, puerto o etiqueta de cable duplicados, y registro de pruebas.
- Estados **verificado**, **pendiente** y **por confirmar**.
- Historial de altas, cambios y eliminaciones.
- Reportes semanales con borrador basado en los registros de la semana y descarga en Markdown.
- Filtros por Colima, Tecomán, Manzanillo y Coquimatlán.

## Tecnologías

Next.js, React, TypeScript, CSS y SQLite mediante el módulo `node:sqlite` de Node.js. La aplicación usa una ruta API local para guardar y consultar registros.

## Instalación rápida

Necesitas **Node.js 24 o posterior** y npm en Windows o macOS.

1. Descarga el código del repositorio desde **Code → Download ZIP** en GitHub y descomprímelo, o clónalo con Git.
2. Abre una terminal en la carpeta del proyecto.
3. Ejecuta:

   ```bash
   npm ci
   npm run seed:demo
   npm run dev
   ```

4. Abre [http://127.0.0.1:3000](http://127.0.0.1:3000).

`seed:demo` es opcional. Solo añade datos ficticios cuando la base está vacía. Para comenzar sin ejemplos, omite ese comando.

Lee [INSTALACION.md](INSTALACION.md) para las instrucciones detalladas en Windows y macOS.

## Comprobaciones

```bash
npm run typecheck
npm test
npm run build
```

## Datos y privacidad

Los registros locales se guardan en `data/network.sqlite`, carpeta excluida de Git. Los nombres e IP del script de demostración son ficticios; los rangos IP son de documentación. **No añadas contraseñas, tokens, claves ni datos reales de una red institucional al repositorio.**

La aplicación personal escucha en `127.0.0.1` y no incorpora inicio de sesión. Está pensada para ejecutarse en tu equipo y mostrar el código en GitHub. Para publicarla como servicio accesible por Internet se necesitaría añadir autenticación, control de permisos y una base de datos administrada. GitHub Pages no ejecuta esta aplicación de servidor.

La versión original alojada en Sites usa una base de datos en la nube y conserva su acceso privado; este repositorio es una adaptación independiente para portafolio.

## Estructura

- `app/dashboard.tsx`: interfaz, filtros, formularios y diagramas.
- `app/api/data/route.ts`: operaciones de lectura y escritura.
- `lib/models.ts`: tipos y plantillas de documentación.
- `lib/record-validation.ts`: validación de los registros.
- `lib/database.ts`: creación de tablas y acceso SQLite.
- `scripts/seed-demo.mjs`: datos ficticios opcionales.
- `tests/`: comprobaciones de validación y persistencia.

Más detalles en [ARQUITECTURA.md](ARQUITECTURA.md). Una descripción lista para adaptar a tu currículum está en [DESCRIPCION_CV.md](DESCRIPCION_CV.md).
