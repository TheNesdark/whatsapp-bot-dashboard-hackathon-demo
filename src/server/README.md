# Servidor

Resumen rápido de la estructura backend para la versión demo.

## Flujo de una petición

```text
Cliente
  -> Express
  -> Middlewares
  -> Rutas
  -> Controladores
  -> Base de datos SQLite o servicios de mensajería
  -> Respuesta JSON o WebSocket
```

## Carpetas principales

```text
src/server/
|-- app.ts
|-- bootstrap.ts
|-- db/
|-- routes/
|-- controllers/
|-- middlewares/
|-- services/
|-- types/
`-- utils/
```

## Notas para demo

- Esta copia está pensada para arrancar con base nueva.
- No incluye datos locales previos.
- El flujo por defecto está neutralizado para uso genérico en presentaciones.
