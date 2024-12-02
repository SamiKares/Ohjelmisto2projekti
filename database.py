import mysql.connector

class Database:
    def __init__(self):
        self.connection = mysql.connector.connect(
        host='localhost',
        port=3306,
        database='aroundtheworld',
        user='ympari',
        password='1234',
        collation = 'utf8mb4_general_ci',
        autocommit=True
        )
    def get_connection(self):
        return self.connection
    