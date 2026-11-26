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

Navegador (Web Crypto, frase maestra en memoria)
    │
    └── /api/vault (Next.js)
            └── SQLite: vaults (solo texto cifrado)
```

- `records` guarda cada ficha con tipo, sede, ubicación, verificación, datos específicos y fechas. El estado de uso de equipos y componentes vive en `payload.estadoUso`; las fichas anteriores sin ese campo se muestran como «Por confirmar».
- `changes` conserva el actor local, la acción, la fecha y los campos modificados. La interfaz muestra los 500 eventos más recientes; la tabla conserva el historial completo.
- Las referencias entre fichas usan identificadores de registro. Los enlaces troncales, puertos y nodos alimentan el visor de topología.
- El diagrama solo une equipos cuando existe un enlace, puerto, nodo o vínculo de telefonía documentado. La sección de administración permite borrar registros de conexión y desvincular un teléfono de su central mediante actualización de la ficha del teléfono. La eliminación de un equipo no borra otras fichas que lo referencian.
- Las fichas de teléfono IP referencian central telefónica, puerto, cable, nodo, dispositivo PoE y computadora. Cada componente referencia su teléfono; la ficha del teléfono muestra los componentes vinculados. La central muestra los teléfonos asociados y el diagrama dibuja sus relaciones de telefonía IP.
- `vaults` contiene un único documento cifrado con credenciales y eventos privados. El navegador deriva una clave de la frase maestra y cifra antes de enviar. La API nunca recibe la frase ni el contenido descifrado. La revisión evita sobrescribir cambios de otra pestaña.
- El inventario y los reportes se filtran en la interfaz por sede. La API valida tipos, sedes, estados, campos permitidos y tamaños antes de escribir.
- Las escrituras usan transacciones. Las actualizaciones comprueban la fecha de la versión leída para detectar cambios concurrentes.
- La aplicación señala referencias faltantes y duplicados de dirección IP, puerto de switch o código de etiqueta de cable.
- `plan_red` documenta la subred IPv4 en CIDR, la puerta de enlace y el porcentaje de reserva. `network-plan.ts` calcula la máscara, capacidad utilizable y direcciones necesarias a partir de los registros visibles; no consulta ni escanea la red. Si no hay una subred documentada, el resumen muestra «Por configurar».
- `example-project.ts` crea una oficina ficticia aislada en `localStorage`. Al activarla, las altas, ediciones, eliminaciones e historial se guardan en esa copia del navegador; nunca se envían a la API ni se mezclan con SQLite o D1. La bóveda queda deshabilitada en el ejemplo.
- `record-sheet.ts` prepara los campos de cualquier registro para una ficha tabular con referencias resueltas. `documentation-report.ts` agrega los totales y resume cada subred documentada por sede sin duplicar direcciones IP en el total de una misma sede. La vista previa puede mostrar una ficha o el documento completo con todas las fichas y el historial; usa tablas HTML y estilos de impresión A4. El navegador abre el diálogo de guardar como PDF únicamente tras pulsar el botón de la vista previa. La bóveda de credenciales queda excluida.

## Límites actuales

- Los datos viven en un archivo SQLite local y no se sincronizan entre computadoras.
- El respaldo cifrado permite trasladar la bóveda; el inventario técnico no se incluye en ese respaldo.
- El proyecto de ejemplo se guarda solo en el navegador donde se cargó. Para respaldar trabajo real en la edición local, copia `data/network.sqlite` con el servidor detenido.
- No hay cuentas ni roles en esta edición. Para alojarla en Internet habría que añadir autenticación, autorización y almacenamiento administrado.
- El diagrama ordena los equipos por tipo y presenta sus conexiones; no es un editor libre de diagramas.
- El historial de la interfaz muestra los 500 cambios recientes para mantener la carga ligera.
- Los eventos de la bóveda se guardan dentro del documento cifrado y aparecen al desbloquearla; el historial general no muestra usuarios ni contraseñas.

## Seguridad de los ejemplos

`scripts/seed-demo.mjs` utiliza nombres marcados como `DEMO` y rangos IP reservados para documentación. `data/` está excluida de Git. Ningún archivo del proyecto requiere contraseñas o tokens. Consulta [SEGURIDAD.md](docs/SEGURIDAD.md) para el diseño y los límites de la bóveda.
