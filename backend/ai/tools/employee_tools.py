from langchain.tools import tool
from database import get_connection


@tool
def get_employee_profile(employee_id: str) -> dict:
    """Get basic profile information for an employee."""
    connection = get_connection()

    employee = connection.execute(
        """
        SELECT
            employee_id,
            name,
            department,
            casual_leave,
            sick_leave
        FROM employees
        WHERE employee_id = ?
        """,
        (employee_id,),
    ).fetchone()

    connection.close()

    if not employee:
        return {
            "success": False,
            "message": "Employee not found",
        }

    return {
        "success": True,
        "employee": dict(employee),
    }


@tool
def get_my_requests(employee_id: str) -> dict:
    """Get an employee's currently open and in-progress requests."""
    connection = get_connection()

    hr_requests = connection.execute(
        """
        SELECT
            request_id AS request_id,
            employee_id,
            request_type AS type,
            description AS description,
            status
        FROM hr_requests
        WHERE employee_id = ?
        AND status NOT IN ('closed', 'rejected', 'approved')
        """,
        (employee_id,),
    ).fetchall()

    it_tickets = connection.execute(
        """
        SELECT
            ticket_id AS request_id,
            employee_id,
            'IT' AS type,
            issue AS description,
            status
        FROM it_tickets
        WHERE employee_id = ?
        AND status NOT IN ('closed', 'rejected', 'approved')
        """,
        (employee_id,),
    ).fetchall()

    maintenance_tickets = connection.execute(
        """
        SELECT
            ticket_id AS request_id,
            employee_id,
            'Facilities' AS type,
            issue AS description,
            status
        FROM maintenance_tickets
        WHERE employee_id = ?
        AND status NOT IN ('closed', 'rejected', 'approved')
        """,
        (employee_id,),
    ).fetchall()

    connection.close()

    requests = [
        dict(request)
        for request in (
            list(hr_requests)
            + list(it_tickets)
            + list(maintenance_tickets)
        )
    ]

    return {
        "success": True,
        "employee_id": employee_id,
        "requests": requests,
        "count": len(requests),
    }


@tool
def get_request_history(employee_id: str) -> dict:
    """Get all HR, IT, Facilities, and approval requests made by an employee."""
    connection = get_connection()

    hr_requests = connection.execute(
        """
        SELECT
            request_id AS request_id,
            employee_id,
            'HR' AS type,
            request_type AS category,
            description,
            status
        FROM hr_requests
        WHERE employee_id = ?
        """,
        (employee_id,),
    ).fetchall()

    it_tickets = connection.execute(
        """
        SELECT
            ticket_id AS request_id,
            employee_id,
            'IT' AS type,
            'IT Support' AS category,
            issue AS description,
            status
        FROM it_tickets
        WHERE employee_id = ?
        """,
        (employee_id,),
    ).fetchall()

    maintenance_tickets = connection.execute(
        """
        SELECT
            ticket_id AS request_id,
            employee_id,
            'Facilities' AS type,
            'Maintenance' AS category,
            issue AS description,
            status
        FROM maintenance_tickets
        WHERE employee_id = ?
        """,
        (employee_id,),
    ).fetchall()

    approvals = connection.execute(
        """
        SELECT
            request_id,
            employee_id,
            department AS type,
            action AS category,
            description,
            status
        FROM approvals
        WHERE employee_id = ?
        """,
        (employee_id,),
    ).fetchall()

    connection.close()

    history = [
        dict(request)
        for request in (
            list(hr_requests)
            + list(it_tickets)
            + list(maintenance_tickets)
            + list(approvals)
        )
    ]

    return {
        "success": True,
        "employee_id": employee_id,
        "requests": history,
        "count": len(history),
    }


@tool
def get_approval_status(request_id: str) -> dict:
    """Get the current status of an HR, IT, or Facilities request."""
    connection = get_connection()

    request = connection.execute(
        """
        SELECT
            request_id,
            employee_id,
            request_type AS category,
            description,
            status
        FROM hr_requests
        WHERE request_id = ?
        """,
        (request_id,),
    ).fetchone()

    if not request:
        request = connection.execute(
            """
            SELECT
                ticket_id AS request_id,
                employee_id,
                'IT Support' AS category,
                issue AS description,
                status
            FROM it_tickets
            WHERE ticket_id = ?
            """,
            (request_id,),
        ).fetchone()

    if not request:
        request = connection.execute(
            """
            SELECT
                ticket_id AS request_id,
                employee_id,
                'Maintenance' AS category,
                issue AS description,
                status
            FROM maintenance_tickets
            WHERE ticket_id = ?
            """,
            (request_id,),
        ).fetchone()

    connection.close()

    if not request:
        return {
            "success": False,
            "message": "Request not found",
            "request_id": request_id,
        }

    return {
        "success": True,
        "request": dict(request),
    }