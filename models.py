from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Form(db.Model):
    __tablename__ = 'form'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    organization = db.Column(db.String(100), default="YES BANK")
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    required_documents = db.Column(db.JSON, nullable=False)  # Store as [{category, docType, displayName}]
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'organization': self.organization,
            'created_at': self.created_at.isoformat(),
            'required_documents': self.required_documents,
            'is_active': self.is_active
        }

class FormSubmission(db.Model):
    __tablename__ = 'form_submission'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    form_id = db.Column(db.Integer, db.ForeignKey('form.id', ondelete='CASCADE'), nullable=False)
    wallet_address = db.Column(db.String(100), nullable=False)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    status = db.Column(db.String(50), default="Submitted", nullable=False)  # Submitted, Approved, Rejected, etc.
    submitted_documents = db.Column(db.JSON, nullable=False)  # Store as [{docType, displayName, fileCID}]
    
    # Define relationship with Form
    form = db.relationship('Form', backref=db.backref('submissions', lazy=True, cascade='all, delete-orphan'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'form_id': self.form_id,
            'form_name': self.form.name if self.form else None,
            'wallet_address': self.wallet_address,
            'submitted_at': self.submitted_at.isoformat(),
            'status': self.status,
            'submitted_documents': self.submitted_documents
        } 