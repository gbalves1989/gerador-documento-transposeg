# gerador-documento-transposeg
Gerador de documentos da transposeg

# gerar o executavel
pyinstaller --onefile --windowed --add-data "app/templates;templates" --add-data "app/static;static" --add-data "data/data.json;data" run.py