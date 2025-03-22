from flask import Flask, render_template, jsonify, request, redirect, url_for
from config import DOCUMENT_TYPES
from models import db, Form, FormSubmission
from init_db import init_database
import os
import requests

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///forms.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)
init_database(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload')
def upload():
    return render_template('upload.html')

@app.route('/view')
def view_documents():
    return render_template('view_docs.html')

@app.route('/api/document-types')
def get_document_types():
    return jsonify(DOCUMENT_TYPES)

@app.route('/admin')
def admin_panel():
    forms = Form.query.order_by(Form.created_at.desc()).all()
    return render_template('admin.html', forms=forms)

@app.route('/admin/create-form', methods=['GET', 'POST'])
def create_form():
    if request.method == 'POST':
        try:
            form_data = request.get_json()
            
            # Validate required fields
            if not form_data.get('name'):
                return jsonify({'success': False, 'error': 'Form name is required'})
            if not form_data.get('required_documents'):
                return jsonify({'success': False, 'error': 'At least one document is required'})
            
            new_form = Form(
                name=form_data['name'],
                required_documents=form_data['required_documents']
            )
            
            db.session.add(new_form)
            db.session.commit()
            
            return jsonify({
                'success': True, 
                'form_id': new_form.id,
                'message': 'Form created successfully'
            })
            
        except Exception as e:
            db.session.rollback()
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
            
    return render_template('create_form.html')

@app.route('/form/<int:form_id>')
def view_form(form_id):
    form = Form.query.get_or_404(form_id)
    wallet_address = request.args.get('wallet')
    user_docs = []
    
    if wallet_address:
        try:
            # Fetch user's documents from your backend
            response = requests.get(f'http://localhost:3000/api/documents/owner/{wallet_address}', params={
                'limit': 50
            })
            if response.ok:
                data = response.json()
                if data.get('success'):
                    user_docs = data.get('data', {}).get('transactions', [])
        except Exception as e:
            print(f"Error fetching user docs: {e}")
    
    return render_template('view_form.html', 
                         form=form, 
                         wallet_address=wallet_address,
                         user_docs=user_docs)

@app.route('/api/submit-form', methods=['POST'])
def submit_form():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('form_id'):
            return jsonify({'success': False, 'error': 'Form ID is required'})
        if not data.get('wallet_address'):
            return jsonify({'success': False, 'error': 'Wallet address is required'})
        if not data.get('submitted_documents'):
            return jsonify({'success': False, 'error': 'Submitted documents are required'})
            
        form = Form.query.get_or_404(data['form_id'])
        
        # Create new submission
        submission = FormSubmission(
            form_id=data['form_id'],
            wallet_address=data['wallet_address'],
            submitted_documents=data['submitted_documents']
        )
        
        db.session.add(submission)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'submission_id': submission.id,
            'message': 'Form submitted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/admin/submissions')
def view_submissions():
    submissions = FormSubmission.query.order_by(FormSubmission.submitted_at.desc()).all()
    return render_template('view_submissions.html', submissions=submissions)

@app.route('/admin/submissions/<int:form_id>')
def view_form_submissions(form_id):
    form = Form.query.get_or_404(form_id)
    submissions = FormSubmission.query.filter_by(form_id=form_id).order_by(FormSubmission.submitted_at.desc()).all()
    return render_template('view_form_submissions.html', form=form, submissions=submissions)

@app.route('/admin/submission/<int:submission_id>')
def view_submission_details(submission_id):
    submission = FormSubmission.query.get_or_404(submission_id)
    return render_template('submission_details.html', submission=submission)

@app.route('/admin/update-submission-status/<int:submission_id>', methods=['POST'])
def update_submission_status(submission_id):
    try:
        data = request.get_json()
        submission = FormSubmission.query.get_or_404(submission_id)
        
        if 'status' in data:
            submission.status = data['status']
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Submission status updated successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Status is required'
            })
            
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/admin/delete-form/<int:form_id>', methods=['POST'])
def delete_form(form_id):
    try:
        form = Form.query.get_or_404(form_id)
        db.session.delete(form)  # Actually delete the form from database
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Form deleted successfully'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/success')
def submission_success():
    submission_id = request.args.get('submission_id')
    submission = None
    
    if submission_id:
        submission = FormSubmission.query.get(submission_id)
    
    return render_template('success.html', submission=submission)

if __name__ == '__main__':
    app.run(debug=True) 