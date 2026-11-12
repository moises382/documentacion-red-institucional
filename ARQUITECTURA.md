# Arquitectura

## Alcance de esta versión

La versión de portafolio conserva la interfaz y las funciones centrales de la aplicación original, pero usa almacenamiento local para poder instalarla sin una cuenta de Sites. El servidor se enlaza a `127.0.0.1` y no tiene autenticación; no está preparado para exposición pública directa.

## Flujo de datos

```text
Navegador (React)
    │
    └── /api/data (Next.js)
            ├── validación de campos y plantillas
            ├── transacción de escritura
            └── SQLite: records + changes
```

- `records` guarda cada ficha con tipo, sede, ubicación, verificación, datos específicos y fechas. El estado de uso de los equipos vive en `payload.estadoUso`; las fichas anteriores sin ese campo se muestran como «Por confirmar».
- `changes` conserva el actor local, la acción, la fecha y los campos modificados. La interfaz muestra los 500 eventos más recientes; la tabla conserva el historial completo.
- Las referencias entre fichas usan identificadores de registro. Los enlaces troncales, puertos y nodos alimentan el visor de topología.
- El inventario y los reportes se filtran en la interfaz por sede. La API valida tipos, sedes, estados, campos permitidos y tamaños antes de escribir.
- Las escrituras usan transacciones. Las actualizaciones comprueban la fecha de la versión leída para detectar cambios concurrentes.
- La aplicación señala referencias faltantes y duplicados de dirección IP, puerto de switch o código de etiqueta de cable.

## Límites actuales

- Los datos viven en un archivo SQLite local y no se sincronizan entre computadoras.
- No hay cuentas ni roles en esta edición. Para alojarla en Internet habría que añadir autenticación, autorización y almacenamiento administrado.
- El diagrama ordena los equipos por tipo y presenta sus conexiones; no es un editor libre de diagramas.
- El historial de la interfaz muestra los 500 cambios recientes para mantener la carga ligera.

## Seguridad de los ejemplos

`scripts/seed-demo.mjs` utiliza nombres marcados como `DEMO` y rangos IP reservados para documentación. `data/` está excluida de Git. Ningún archivo del proyecto requiere contraseñas o tokens.
