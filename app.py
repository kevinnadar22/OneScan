from flask import Flask, render_template, jsonify
from config import DOCUMENT_TYPES

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload')
def upload():
    return render_template('upload.html')

@app.route('/api/document-types')
def get_document_types():
    return jsonify(DOCUMENT_TYPES)

if __name__ == '__main__':
    app.run(debug=True) 