from langchain.tools import tool

from database import get_connection


@tool
def check_maintenance_status(ticket_id: str) -> dict:
    """Check the current status of a facilities maintenance ticket."""

    connection = get_connection()

    ticket = connection.execute(
        """
        SELECT ticket_id, employee_id, issue, status
        FROM maintenance_tickets
        WHERE ticket_id = ?
        """,
        (ticket_id,),
    ).fetchone()

    connection.close()

    if not ticket:
        return {
            "success": False,
            "message": "Maintenance ticket not found",
        }

    return {
        "success": True,
        "ticket": dict(ticket),
    }


@tool
def create_maintenance_ticket(
    employee_id: str,
    issue: str,
) -> dict:
    """Create a new facilities maintenance ticket for an employee."""

    connection = get_connection()

    employee = connection.execute(
        """
        SELECT employee_id
        FROM employees
        WHERE employee_id = ?
        """,
        (employee_id,),
    ).fetchone()

    if not employee:
        connection.close()

        return {
            "success": False,
            "message": "Employee not found",
        }

    count = connection.execute(
        """
        SELECT COUNT(*) AS count
        FROM maintenance_tickets
        """
    ).fetchone()["count"]

    ticket_id = f"FM-{count + 1:03d}"

    ticket = {
        "ticket_id": ticket_id,
        "employee_id": employee_id,
        "issue": issue,
        "status": "open",
    }

    connection.execute(
        """
        INSERT INTO maintenance_tickets (
            ticket_id,
            employee_id,
            issue,
            status
        )
        VALUES (?, ?, ?, ?)
        """,
        (
            ticket_id,
            employee_id,
            issue,
            "open",
        ),
    )

    connection.commit()
    connection.close()

    return {
        "success": True,
        "ticket": ticket,
    }