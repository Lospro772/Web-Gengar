import sqlite3
import hashlib
import os
import sys

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gengar_vault.db')

def init_database(default_password="GengarMaestro2026!"):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Crear tabla de seguridad
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vault_secrets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key_name TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Generar salt y hash
    salt = os.urandom(16).hex()
    salted_pwd = (salt + default_password).encode('utf-8')
    pwd_hash = hashlib.sha256(salted_pwd).hexdigest()

    cursor.execute('''
        INSERT INTO vault_secrets (key_name, password_hash, salt)
        VALUES ('creator_master_key', ?, ?)
        ON CONFLICT(key_name) DO UPDATE SET
            password_hash = excluded.password_hash,
            salt = excluded.salt,
            updated_at = CURRENT_TIMESTAMP
    ''', (pwd_hash, salt))

    conn.commit()
    conn.close()
    print(f"Base de datos SQLite inicializada exitosamente en: {DB_PATH}")
    print(f"Contraseña maestra configurada: {default_password}")

if __name__ == '__main__':
    pwd = sys.argv[1] if len(sys.argv) > 1 else "GengarMaestro2026!"
    init_database(pwd)
