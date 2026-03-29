# WhatsApp Bot Dashboard - Hackathon Demo 🚀

Un dashboard moderno y robusto para la gestión de bots de WhatsApp, diseñado para escalar y facilitar la interacción con clientes en tiempo real. Este proyecto fue desarrollado como una solución integral para el control de flujos, gestión de registros y monitoreo de instancias de WhatsApp.

## ✨ Características Principales

- **📱 Gestión de Instancias**: Conecta y administra múltiples números de WhatsApp de forma independiente.
- **🤖 Constructor de Flujos (Flow Builder)**: Diseña experiencias interactivas visualmente usando `@xyflow/react`.
- **📊 Dashboard de Métricas**: Visualiza estadísticas en tiempo real sobre registros, aceptaciones y rechazos.
- **💬 Chat Multicanal**: Responde mensajes directamente desde el panel con soporte para imágenes.
- **🔒 Seguridad**: Sistema de acceso protegido por contraseña configurable.
- **⚡ Tiempo Real**: Sincronización instantánea mediante WebSockets.
- **📥 Exportación**: Genera reportes detallados en formato Excel (XLSX).

## 🛠️ Stack Tecnológico

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React.
- **Backend**: Node.js / Bun, Express, WebSockets (ws).
- **Base de Datos**: SQLite (vía `better-sqlite3`).
- **Estado y Datos**: TanStack Query (React Query), Zustand.
- **Animaciones**: Motion (Framer Motion).

## 🚀 Inicio Rápido

### Requisitos Previos

- [Bun](https://bun.sh/) instalado (recomendado) o Node.js v20+.

### Instalación

1. Clona el repositorio:

   ```bash
   git clone https://github.com/tu-usuario/whatsapp-bot-dashboard.git
   cd whatsapp-bot-dashboard
   ```
2. Instala las dependencias:

   ```bash
   bun install
   ```
3. Configura las variables de entorno:

   ```bash
   cp .env.example .env
   ```

   *Edita el archivo `.env` con tus credenciales de la API de WhatsApp (Token, Phone Number ID, etc.).*

### Desarrollo

Para iniciar el servidor con recarga en caliente (hot reload):

```bash
bun run dev
```

El dashboard estará disponible en `http://localhost:3002`.

### Producción

1. Construye el frontend:
   ```bash
   bun run build
   ```
2. Inicia el servidor en modo producción:
   ```bash
   bun run preview
   ```

## 📁 Estructura del Proyecto

- `src/client/`: Aplicación frontend (React).
- `src/server/`: Lógica del servidor, controladores y servicios de WhatsApp.
- `src/shared/`: Tipos y constantes compartidos entre cliente y servidor.
- `db/`: Almacenamiento de la base de datos SQLite.
- `scripts/`: Utilidades para compilación y servidores MCP.---

Desarrollado con ❤️ para el ecosistema de automatización de WhatsApp.

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
