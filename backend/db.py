import os

import pymysql
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))


def get_connection():
    return pymysql.connect(
        host=os.getenv("DB_HOST") or "localhost",
        port=int(os.getenv("DB_PORT") or 3306),
        user=os.getenv("DB_USER") or "root",
        password=os.getenv("DB_PASSWORD") or "",
        database=os.getenv("DB_NAME") or "research_portal",
        cursorclass=pymysql.cursors.DictCursor,
    )


def run_query(sql, values=None, fetch=None):
    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(sql, values)
        if fetch == "all":
            return cursor.fetchall()
        if fetch == "one":
            return cursor.fetchone()
        connection.commit()
        return cursor.lastrowid
    finally:
        connection.close()
