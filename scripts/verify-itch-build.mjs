import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const indexPath = path.join(distDir, 'index.html');

if (!existsSync(indexPath)) {
  throw new Error('No existe dist/index.html. Ejecuta primero el build de producción.');
}

const html = readFileSync(indexPath, 'utf8');
const references = [...html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)]
  .map((match) => match[1])
  .filter((value) => !/^(?:https?:|data:|mailto:|#|\/\/)/i.test(value));

if (references.length === 0) {
  throw new Error('No se encontraron recursos locales en dist/index.html.');
}

for (const reference of references) {
  if (reference.startsWith('/')) {
    throw new Error(`Ruta absoluta no compatible con el subdirectorio de itch.io: ${reference}`);
  }

  const pathname = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
  const resolvedPath = path.resolve(distDir, pathname);

  if (!resolvedPath.startsWith(distDir + path.sep) && resolvedPath !== indexPath) {
    throw new Error(`Referencia fuera de dist: ${reference}`);
  }

  if (!existsSync(resolvedPath)) {
    throw new Error(`Falta el recurso del build: ${reference}`);
  }
}

console.log(`Build HTML5 verificado: dist/index.html y ${references.length} recursos relativos encontrados.`);
