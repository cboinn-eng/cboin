from fastapi import APIRouter, Request, HTTPException, Response
from database import Database
import hashlib
import datetime

router = APIRouter()

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

@router.post("/register")
async def register(request: Request):
    data = await request.json()
    
    if not data or not data.get('email') or not data.get('password') or not data.get('username'):
        raise HTTPException(status_code=400, detail='Eksik bilgi!')
        
    success, message = auth_service.register_user(data['username'], data['password'], data['email'])
    if not success:
        raise HTTPException(status_code=400, detail=message)
        
    return {"message": "Kayıt başarılı!"}

@router.post("/login")
async def login(request: Request):
    data = await request.json()
    
    if not data or not data.get('email') or not data.get('password'):
        raise HTTPException(status_code=400, detail='Eksik bilgi!')
        
    user = auth_service.db.get_user_by_email(data['email'])
    if not user:
        raise HTTPException(status_code=401, detail='Email veya şifre hatalı!')
        
    success = auth_service.authenticate_user(user['username'], data['password'])
    if not success:
        raise HTTPException(status_code=401, detail='Email veya şifre hatalı!')
        
    return {
        "user": {
            "username": user['username'],
            "email": user['email']
        }
    }

@router.get("/me")
async def get_user(request: Request):
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        raise HTTPException(status_code=401, detail='Token bulunamadı!')
        
    username = auth_header.split(' ')[1]
    user = auth_service.db.get_user_by_username(username)
    if not user:
        raise HTTPException(status_code=401, detail='Geçersiz token!')
        
    return {
        "username": user['username'],
        "email": user['email']
    }

@router.post("/logout")
async def logout():
    # Client tarafında token silinecek
    return {"message": "Başarıyla çıkış yapıldı!"}
