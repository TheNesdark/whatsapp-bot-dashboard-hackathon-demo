# WhatsApp Bot Dashboard Demo

Versión limpia del proyecto preparada para demos y hackatones.

Esta copia fue pensada para:
- arrancar sin historial git local,
- no incluir bases de datos ni artefactos con información previa,
- mostrar un flujo genérico de captación y seguimiento,
- evitar referencias directas a datos personales o a un caso real concreto.

## Qué se limpió

- Se excluyó `.git`.
- Se excluyeron `db/`, `build/`, `dist/`, `.vscode/` y `node_modules/`.
- Se reemplazaron los textos y defaults del flujo por mensajes de demo.
- Se neutralizaron variables y etiquetas iniciales para no mostrar nombres reales de dominio.

## Arranque

1. Instala dependencias:
   ```bash
   bun install
   ```
2. Crea tu `.env` a partir de `.env.example`.
   Variables clave para WhatsApp:
   `WABA_VERIFY_TOKEN`, `WHATSAPP_ACCESS_TOKEN`, `WABA_PHONE_NUMBER_ID`, `APP_URL`
3. Inicia en desarrollo:
   ```bash
   bun run dev
   ```

## Nota

La base de datos no viene incluida en esta versión. Al iniciar, el proyecto generará una base nueva y vacía para la demo.
