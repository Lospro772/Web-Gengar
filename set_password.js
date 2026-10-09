const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = path.join(__dirname, 'gengar_vault.db');

function setMasterPassword(newPassword) {
  if (!newPassword || !newPassword.trim()) {
    console.error("Error: Debes proporcionar una contraseña no vacía.");
    process.exit(1);
  }

  const pwd = newPassword.trim();
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

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(salt + pwd).digest('hex');

  const existing = db.prepare("SELECT * FROM vault_secrets WHERE key_name = 'creator_master_key'").get();
  if (existing) {
    db.prepare(`
      UPDATE vault_secrets 
      SET password_hash = ?, salt = ?, updated_at = CURRENT_TIMESTAMP
      WHERE key_name = 'creator_master_key'
    `).run(hash, salt);
  } else {
    db.prepare(`
      INSERT INTO vault_secrets (key_name, password_hash, salt)
      VALUES ('creator_master_key', ?, ?)
    `).run(hash, salt);
  }

  console.log("====================================================");
  console.log("🔒 CONTRASEÑA MAESTRA ACTUALIZADA EN SQLITE");
  console.log(`Nueva contraseña establecida: ${pwd}`);
  console.log("Esta clave SOLO se valida en el servidor local.");
  console.log("Tu amigo NO podrá verla en el navegador ni en DevTools.");
  console.log("====================================================");
}

const inputArg = process.argv[2];
if (inputArg) {
  setMasterPassword(inputArg);
} else {
  console.log("Uso: node set_password.js <tu_nueva_contraseña>");
}
