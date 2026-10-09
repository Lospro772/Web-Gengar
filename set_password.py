import sqlite3
import hashlib
import os
import sys

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gengar_vault.db')

def update_password(new_password):
    if not new_password or not new_password.strip():
        print("Error: La contraseña no puede estar vacía.")
        return

    new_password = new_password.strip()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    salt = os.urandom(16).hex()
    salted_pwd = (salt + new_password).encode('utf-8')
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
    print("====================================================")
    print("🔒 CONTRASEÑA MAESTRA ACTUALIZADA EXITOSAMENTE")
    print(f"Nueva contraseña guardada en la base de datos local: {new_password}")
    print("Tu amigo NO podrá verla en el código frontend ni en DevTools.")
    print("====================================================")

if __name__ == '__main__':
    if len(sys.argv) > 1:
        update_password(sys.argv[1])
    else:
        pwd = input("Introduce la nueva contraseña secreta del creador: ")
        update_password(pwd)
