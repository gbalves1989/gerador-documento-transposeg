import os
import sys
import threading
import webbrowser
from flask import Flask
from core.config import Config

# ----------------------------
# 🔧 Corrige caminhos no .exe
# ----------------------------
def resource_path(relative_path):
    try:
        base_path = sys._MEIPASS  # PyInstaller
    except Exception:
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)

# ----------------------------
# 🚀 Criação do Flask
# ----------------------------
app = Flask(
    __name__,
    template_folder=resource_path("templates"),
    static_folder=resource_path("static")
)
app.config.from_object(Config)

# ----------------------------
# 📁 Pastas do projeto
# ----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(Config.BASE_DIR, "uploads")
OUTPUT_DIR = os.path.join(Config.BASE_DIR, "outputs")


os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ----------------------------
# 🔌 REGISTRA ROTAS
# ----------------------------
from app.routes.generator import generator_blueprint
app.register_blueprint(generator_blueprint)

# ----------------------------
# 🌐 Abrir navegador automático
# ----------------------------
def open_browser():
    webbrowser.open("http://127.0.0.1:5000")

# ----------------------------
# ▶️ RUN
# ----------------------------
if __name__ == "__main__":

    # Evita abrir 2 abas no modo debug
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true" or not app.debug:
        threading.Timer(1, open_browser).start()

    # Para executável, usar debug=False
    app.run(host="127.0.0.1", port=5000, debug=False)