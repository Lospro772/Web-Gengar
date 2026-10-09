const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const PORT = 8090;
const BASE_DIR = __dirname;
const DB_PATH = path.join(BASE_DIR, 'gengar_vault.db');

// Inicializar SQLite
const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS vault_secrets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_name TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Asegurar que existe una clave maestra por defecto si no existe
const existingKey = db.prepare("SELECT * FROM vault_secrets WHERE key_name = 'creator_master_key'").get();
if (!existingKey) {
  const defaultPassword = "GengarMaestro2026!";
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(salt + defaultPassword).digest('hex');
  db.prepare(`
    INSERT INTO vault_secrets (key_name, password_hash, salt)
    VALUES ('creator_master_key', ?, ?)
  `).run(hash, salt);
  console.log(`[Database] Contraseña maestra inicial creada: ${defaultPassword}`);
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Manejo de verificación de contraseña maestra por SQLite
  if (req.method === 'POST' && req.url === '/api/verify-bypass') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const inputPassword = (data.password || '').trim();

        const row = db.prepare("SELECT password_hash, salt FROM vault_secrets WHERE key_name = 'creator_master_key'").get();
        if (!row) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: 'Clave no configurada' }));
        }

        const inputHash = crypto.createHash('sha256').update(row.salt + inputPassword).digest('hex');
        if (inputHash === row.password_hash) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ 
            success: true, 
            message: '¡Sello del Creador verificado! Acceso concedido.' 
          }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ 
            success: false, 
            message: '¡Contraseña incorrecta! Gengar rechaza tu intento.' 
          }));
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: 'Datos inválidos' }));
      }
    });
    return;
  }

  // Métodos no permitidos
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    return res.end('Method Not Allowed');
  }

  // Limpiar URL y prevenir Path Traversal
  const cleanUrl = req.url.split('?')[0];
  let relativePath = (cleanUrl === '/' || cleanUrl === '') ? 'index.html' : cleanUrl.replace(/^\/+/, '');
  relativePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');

  // Proteger la base de datos y scripts de backend
  if (relativePath.endsWith('.db') || relativePath.endsWith('.py') || relativePath === 'server.js' || relativePath === 'set_password.js') {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Prohibido: Acceso denegado a las profundidades de la torre.');
  }

  const filePath = path.join(BASE_DIR, relativePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`[Gengar Server] Activo en http://localhost:${PORT}`);
  console.log(`[Database] SQLite Database: ${DB_PATH}`);
});
