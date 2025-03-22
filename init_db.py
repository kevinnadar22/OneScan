from flask import Flask
from models import db
import os

def init_database(app):
    # Create database file if it doesn't exist
    db_path = 'forms.db'
    if not os.path.exists(db_path):
        # Initialize database
        with app.app_context():
            db.create_all()
            print("Database initialized and tables created.")
    else:
        print("Database already exists.")

if __name__ == '__main__':
    # Create a temporary Flask app just for database initialization
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///forms.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize database with the app
    db.init_app(app)
    init_database(app) 