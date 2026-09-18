import sqlite3
from pathlib import Path


DB_PATH = Path(__file__).resolve().parent / "workmate.db"


def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS employees (
            employee_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            department TEXT NOT NULL,
            casual_leave INTEGER NOT NULL,
            sick_leave INTEGER NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS it_tickets (
            ticket_id TEXT PRIMARY KEY,
            employee_id TEXT NOT NULL,
            issue TEXT NOT NULL,
            status TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS hr_requests (
            request_id TEXT PRIMARY KEY,
            employee_id TEXT NOT NULL,
            employee_name TEXT NOT NULL,
            request_type TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS maintenance_tickets (
            ticket_id TEXT PRIMARY KEY,
            employee_id TEXT NOT NULL,
            issue TEXT NOT NULL,
            status TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            thread_id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            thread_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    connection.commit()
    connection.close()


if __name__ == "__main__":
    init_db()
    print(f"Database initialized: {DB_PATH}")


def create_conversation(thread_id: str, title: str):
    connection = get_connection()

    connection.execute(
        """
        INSERT OR IGNORE INTO conversations (
            thread_id,
            title
        )
        VALUES (?, ?)
        """,
        (thread_id, title),
    )

    connection.commit()
    connection.close()


def save_message(
    thread_id: str,
    role: str,
    content: str,
):
    connection = get_connection()

    connection.execute(
        """
        INSERT INTO chat_messages (
            thread_id,
            role,
            content
        )
        VALUES (?, ?, ?)
        """,
        (
            thread_id,
            role,
            content,
        ),
    )

    connection.execute(
        """
        UPDATE conversations
        SET updated_at = CURRENT_TIMESTAMP
        WHERE thread_id = ?
        """,
        (thread_id,),
    )

    connection.commit()
    connection.close()


def get_chat_history(thread_id: str):
    connection = get_connection()

    messages = connection.execute(
        """
        SELECT role, content
        FROM chat_messages
        WHERE thread_id = ?
        ORDER BY id ASC
        """,
        (thread_id,),
    ).fetchall()

    connection.close()

    return [dict(message) for message in messages]


def get_conversations():
    connection = get_connection()

    conversations = connection.execute(
        """
        SELECT thread_id, title, created_at, updated_at
        FROM conversations
        ORDER BY updated_at DESC
        """
    ).fetchall()

    connection.close()

    return [dict(conversation) for conversation in conversations]