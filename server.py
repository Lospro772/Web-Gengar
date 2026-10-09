import http.server
import json
import sqlite3
import hashlib
import os
import sys

PORT = 8090
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)
DB_PATH = os.path.join(BASE_DIR, 'gengar_vault.db')

class SpectralRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        clean_path = self.path.split('?')[0].lower()
        if clean_path.endswith('.db') or clean_path.endswith('.py'):
            self.send_error(403, "Acceso denegado a las sombras de la torre.")
            return
        return super().do_GET()

    def do_POST(self):
        if self.path == '/api/verify-bypass':
            try:
                length = int(self.headers.get('content-length', 0))
                body = self.rfile.read(length).decode('utf-8')
                data = json.loads(body)
                pwd = data.get('password', '').strip()

                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()
                c.execute("SELECT password_hash, salt FROM vault_secrets WHERE key_name = 'creator_master_key'")
                row = c.fetchone()
                conn.close()

                if not row:
                    res = {"success": False, "message": "Clave no encontrada"}
                else:
                    stored_hash, salt = row
                    calc_hash = hashlib.sha256((salt + pwd).encode('utf-8')).hexdigest()
                    if calc_hash == stored_hash:
                        res = {"success": True, "message": "Acceso de creador concedido"}
                    else:
                        res = {"success": False, "message": "Contraseña sombría incorrecta"}

                res_bytes = json.dumps(res).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(res_bytes)))
                self.end_headers()
                self.wfile.write(res_bytes)
            except Exception as e:
                err_bytes = json.dumps({"success": False, "message": str(e)}).encode('utf-8')
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err_bytes)))
                self.end_headers()
                self.wfile.write(err_bytes)
        else:
            self.send_error(404, "Not Found")

def run():
    server_address = ('', PORT)
    httpd = http.server.HTTPServer(server_address, SpectralRequestHandler)
    print(f"[Gengar Server] Activo en http://localhost:{PORT}")
    print(f"[Database] SQLite DB: {DB_PATH}")
    sys.stdout.flush()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass

if __name__ == '__main__':
    run()
