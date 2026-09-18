from langchain.tools import tool

from database import get_connection


@tool
def check_leave_balance(employee_id: str) -> dict:
    """Check an employee's available casual and sick leave balance."""

    connection = get_connection()

    employee = connection.execute(
        """
        SELECT employee_id, name, casual_leave, sick_leave
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
        "employee_id": employee["employee_id"],
        "employee_name": employee["name"],
        "casual_leave": employee["casual_leave"],
        "sick_leave": employee["sick_leave"],
    }


@tool
def create_hr_request(
    employee_id: str,
    request_type: str,
    description: str,
) -> dict:
    """Create an HR request for an employee."""

    connection = get_connection()

    employee = connection.execute(
        """
        SELECT employee_id, name
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
        FROM hr_requests
        """
    ).fetchone()["count"]

    request_id = f"HR-{count + 1:03d}"

    connection.execute(
        """
        INSERT INTO hr_requests (
            request_id,
            employee_id,
            employee_name,
            request_type,
            description,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            request_id,
            employee["employee_id"],
            employee["name"],
            request_type,
            description,
            "created",
        ),
    )

    connection.commit()
    connection.close()

    return {
        "success": True,
        "request": {
            "request_id": request_id,
            "employee_id": employee["employee_id"],
            "employee_name": employee["name"],
            "request_type": request_type,
            "description": description,
            "status": "created",
        },
    }