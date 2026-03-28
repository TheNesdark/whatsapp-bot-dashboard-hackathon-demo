import { spawnSync } from 'child_process';
import { rmSync, mkdirSync, existsSync, writeFileSync } from 'fs';
import path from 'path';

const BUILD_DIR = 'build';
const OUT_FILE = 'whatsapp-dashboard.exe';

console.log('--- Iniciando construcción del ejecutable ---');

try {
    // 1. Build Frontend
    console.log('Construyendo frontend (Vite)...');
    spawnSync('bun', ['run', 'build'], { stdio: 'inherit', shell: true });

    // 2. Limpiar build previo
    if (existsSync(BUILD_DIR)) {
        rmSync(BUILD_DIR, { recursive: true, force: true });
    }
    mkdirSync(BUILD_DIR);

    // 3. Compilar Servidor
    console.log(`Compilando servidor con bun build...`);
    spawnSync('bun', ['build', 'server.ts', '--compile', '--external', 'lightningcss', '--outfile', path.join(BUILD_DIR, OUT_FILE)], {
        stdio: 'inherit',
        shell: true
    });

    // 4. Copiar Assets
    console.log('Copiando assets...');
    require('fs').cpSync('dist', path.join(BUILD_DIR, 'dist'), { recursive: true });

    console.log('Construcción exitosa en:', BUILD_DIR);
} catch (error) {
    console.error('Error:', error);
}

console.log('--- Proceso finalizado ---');
