from database import get_connection, init_db


def seed_database():
    init_db()

    connection = get_connection()

    connection.execute(
        """
        INSERT OR IGNORE INTO employees (
            employee_id,
            name,
            department,
            casual_leave,
            sick_leave
        )
        VALUES (?, ?, ?, ?, ?)
        """,
        ("EMP001", "Samuel", "IT", 5, 3),
    )

    connection.execute(
        """
        INSERT OR IGNORE INTO employees (
            employee_id,
            name,
            department,
            casual_leave,
            sick_leave
        )
        VALUES (?, ?, ?, ?, ?)
        """,
        ("EMP002", "Arun", "IT", 2, 5),
    )

    connection.execute(
        """
        INSERT OR IGNORE INTO it_tickets (
            ticket_id,
            employee_id,
            issue,
            status
        )
        VALUES (?, ?, ?, ?)
        """,
        (
            "IT-001",
            "EMP001",
            "Laptop is running slowly",
            "open",
        ),
    )

    connection.execute(
        """
        INSERT OR IGNORE INTO it_tickets (
            ticket_id,
            employee_id,
            issue,
            status
        )
        VALUES (?, ?, ?, ?)
        """,
        (
            "IT-002",
            "EMP002",
            "Unable to connect to VPN",
            "in_progress",
        ),
    )

    connection.execute(
        """
        INSERT OR IGNORE INTO maintenance_tickets (
            ticket_id,
            employee_id,
            issue,
            status
        )
        VALUES (?, ?, ?, ?)
        """,
        (
            "FM-001",
            "EMP001",
            "Air conditioner is not working",
            "open",
        ),
    )

    connection.execute(
        """
        INSERT OR IGNORE INTO maintenance_tickets (
            ticket_id,
            employee_id,
            issue,
            status
        )
        VALUES (?, ?, ?, ?)
        """,
        (
            "FM-002",
            "EMP002",
            "Office light is not working",
            "in_progress",
        ),
    )

    connection.commit()
    connection.close()

    print("Database seeded successfully.")


if __name__ == "__main__":
    seed_database()