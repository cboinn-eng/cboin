import sqlite3
import logging
import os
from datetime import datetime
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        # Get database path from environment variable or use default
        self.db_path = os.getenv('DATABASE_PATH', 'cboin.db')
        self._create_tables()
        
    def _create_tables(self):
        """Veritabanını ve tabloları oluştur"""
        try:
            if not os.path.exists(self.db_path):
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                
                # Users tablosu
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        username TEXT UNIQUE NOT NULL,
                        password TEXT NOT NULL,
                        email TEXT UNIQUE NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                conn.commit()
                conn.close()
        except Exception as e:
            logger.error(f"Error creating tables: {str(e)}")
    
    def create_user(self, username, password, email):
        """Yeni kullanıcı oluştur"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute(
                'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
                (username, password, email)
            )
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            return False
    
    def get_user_by_username(self, username):
        """Kullanıcıyı kullanıcı adına göre getir"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
            user = cursor.fetchone()
            
            conn.close()
            
            if user:
                return {
                    'id': user[0],
                    'username': user[1],
                    'password': user[2],
                    'email': user[3],
                    'created_at': user[4]
                }
            return None
        except Exception as e:
            logger.error(f"Error getting user: {str(e)}")
            return None
    
    def get_user_by_email(self, email):
        """Kullanıcıyı email'e göre getir"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
            user = cursor.fetchone()
            
            conn.close()
            
            if user:
                return {
                    'id': user[0],
                    'username': user[1],
                    'password': user[2],
                    'email': user[3],
                    'created_at': user[4]
                }
            return None
        except Exception as e:
            logger.error(f"Error getting user: {str(e)}")
            return None

# Dependency
def get_db():
    db = Database()
    try:
        yield db
    finally:
        pass
