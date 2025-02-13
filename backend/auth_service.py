from flask import Blueprint, request, jsonify
from database import Database
import hashlib
import datetime

auth = Blueprint('auth', __name__)

class AuthService:
    def __init__(self):
        self.db = Database()
        
    def authenticate_user(self, username, password):
        # Basit şifre hash'leme
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        
        # Kullanıcıyı veritabanında ara
        user = self.db.get_user_by_username(username)
        if user and user['password'] == hashed_password:
            return True
        return False
    
    def register_user(self, username, password, email):
        # Şifreyi hash'le
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        
        # Kullanıcı zaten var mı kontrol et
        if self.db.get_user_by_username(username):
            return False, "Username already exists"
            
        if self.db.get_user_by_email(email):
            return False, "Email already exists"
        
        # Yeni kullanıcı oluştur
        success = self.db.create_user(username, hashed_password, email)
        if success:
            return True, "User registered successfully"
        return False, "Registration failed"

    def get_user_by_username(self, username):
        return self.db.get_user_by_username(username)

auth_service = AuthService()

@auth.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password') or not data.get('username'):
        return jsonify({'message': 'Eksik bilgi!'}), 400
        
    success, message = auth_service.register_user(data['username'], data['password'], data['email'])
    if not success:
        return jsonify({'message': message}), 400
        
    return jsonify({'message': 'Kayıt başarılı!'}), 201

@auth.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Eksik bilgi!'}), 400
        
    user = auth_service.db.get_user_by_email(data['email'])
    if not user:
        return jsonify({'message': 'Email veya şifre hatalı!'}), 401
        
    success = auth_service.authenticate_user(user['username'], data['password'])
    if not success:
        return jsonify({'message': 'Email veya şifre hatalı!'}), 401
        
    return jsonify({
        'user': {
            'username': user['username'],
            'email': user['email']
        }
    }), 200

@auth.route('/me', methods=['GET'])
def get_user():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'message': 'Token bulunamadı!'}), 401
        
    username = auth_header.split(' ')[1]
    user = auth_service.db.get_user_by_username(username)
    if not user:
        return jsonify({'message': 'Geçersiz token!'}), 401
        
    return jsonify({
        'username': user['username'],
        'email': user['email']
    }), 200

@auth.route('/logout', methods=['POST'])
def logout():
    # Client tarafında token silinecek
    return jsonify({'message': 'Başarıyla çıkış yapıldı!'}), 200
