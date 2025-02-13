from pymongo import MongoClient
from flask import g

def get_db():
    if 'db' not in g:
        client = MongoClient('mongodb://localhost:27017/')
        g.db = client.cboin_db
    return g.db

def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.client.close()
