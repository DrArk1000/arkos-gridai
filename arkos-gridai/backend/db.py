import duckdb
import uuid
from datetime import datetime

DB_PATH = "arkos.duckdb"

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY,
    lat DOUBLE,
    lon DOUBLE,
    connection INT,
    curtailment INT,
    delay INT,
    created_at TIMESTAMP
);
"""

def get_connection():
    conn = duckdb.connect(DB_PATH)
    conn.execute(CREATE_TABLE_SQL)
    return conn
