# WhatsApp Bot Dashboard - Hackathon Demo 🚀

Un dashboard moderno y robusto para la gestión de bots de WhatsApp, diseñado para escalar y facilitar la interacción con clientes en tiempo real. Este proyecto permite diseñar flujos conversacionales complejos de forma visual y monitorear la actividad del bot desde una interfaz intuitiva.

## ✨ Características Principales

- **🤖 Constructor de Flujos (Flow Builder)**: Diseña experiencias interactivas visualmente usando `@xyflow/react`. Soporta nodos de mensaje, preguntas, menús, botones, condiciones y aprobación de operadores.
- **🧪 Simulador de Chat Integrado**: Prueba tus flujos en tiempo real directamente desde el dashboard con un simulador interactivo que emula el comportamiento de WhatsApp.
- **📱 Gestión de Instancias**: Conecta y administra múltiples números de WhatsApp de forma independiente.
- **📊 Dashboard de Métricas**: Visualiza estadísticas en tiempo real sobre registros, aceptaciones y rechazos.
- **💬 Chat Multicanal**: Responde mensajes directamente desde el panel con soporte para imágenes y gestión de estados.
- **🔒 Seguridad y Privacidad**: 
  - IDs de variables ofuscados para proteger datos sensibles.
  - Sistema de acceso protegido por contraseña configurable.
  - Ofuscación de números de teléfono en modo demo.
- **⚡ Tiempo Real**: Sincronización instantánea mediante WebSockets para actualizaciones de mensajes y estados.
- **📥 Exportación**: Genera reportes detallados en formato Excel (XLSX).

## 🛠️ Stack Tecnológico

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React.
- **Backend**: Node.js / Bun, Express, WebSockets (ws).
- **Base de Datos**: SQLite (vía `bun:sqlite`).
- **Estado y Datos**: TanStack Query (React Query), Zustand.
- **Animaciones**: Motion (Framer Motion).

## 🚀 Inicio Rápido

### Requisitos Previos

- [Bun](https://bun.sh/) instalado (recomendado).

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
   Crea un archivo `.env` en la raíz del proyecto:
   ```env
   PORT=3002
   WABA_VERIFY_TOKEN=tu_token_de_verificacion
   WHATSAPP_ACCESS_TOKEN=tu_access_token_de_meta
   WABA_PHONE_NUMBER_ID=tu_phone_number_id
   APP_URL=http://localhost:3002
   ```

### Desarrollo

Para iniciar el servidor con recarga en caliente (hot reload):
```bash
bun run dev
```
El dashboard estará disponible en `http://localhost:3002`.

## 📁 Estructura del Proyecto

- `src/client/`: Aplicación frontend (React).
- `src/server/`: Lógica del servidor, controladores y servicios de WhatsApp.
  - `config.ts`: Configuración centralizada por defecto.
  - `flows/`: Motor de ejecución de flujos y generador de flujo por defecto.
- `src/shared/`: Tipos y constantes compartidos entre cliente y servidor.
- `db/`: Almacenamiento de la base de datos SQLite.
- `scripts/`: Utilidades para compilación y servidores MCP.

## ⚙️ Configuración Centralizada

El proyecto utiliza un archivo de configuración centralizado en `src/server/config.ts` donde puedes definir:
- Mensajes por defecto del bot.
- Listas de opciones para menús.
- Variables de flujo con IDs genéricos para mayor seguridad.
- Parámetros de seguridad y tiempos de sesión.

---

Desarrollado con ❤️ para el ecosistema de automatización de WhatsApp.

## Nota

La base de datos no viene incluida en esta versión. Al iniciar, el proyecto generará una base nueva y vacía para la demo.
