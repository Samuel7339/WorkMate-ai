from langchain.tools import tool

from database import get_connection


@tool
def check_ticket_status(ticket_id: str) -> dict:
    """Check the current status of an IT support ticket."""

    connection = get_connection()

    ticket = connection.execute(
        """
        SELECT ticket_id, employee_id, issue, status
        FROM it_tickets
        WHERE ticket_id = ?
        """,
        (ticket_id,),
    ).fetchone()

    connection.close()

    if not ticket:
        return {
            "success": False,
            "message": "Ticket not found",
        }

    return {
        "success": True,
        "ticket": dict(ticket),
    }


@tool
def create_it_ticket(
    employee_id: str,
    issue: str,
) -> dict:
    """Create a new IT support ticket for an employee."""

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
        FROM it_tickets
        """
    ).fetchone()["count"]

    ticket_id = f"IT-{count + 1:03d}"

    ticket = {
        "ticket_id": ticket_id,
        "employee_id": employee_id,
        "issue": issue,
        "status": "open",
    }

    connection.execute(
        """
        INSERT INTO it_tickets (
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