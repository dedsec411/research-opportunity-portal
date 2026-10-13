import os

from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from db import get_connection, run_query
from validation import ALL_FIELDS, TEXT_FIELDS, validate_opportunity

app = Flask(__name__, static_folder="../frontend", static_url_path="")
app.json.sort_keys = False
CORS(app)


def format_row(row):
    if row:
        row["application_deadline"] = str(row["application_deadline"])
    return row


def find_opportunity(opportunity_id):
    row = run_query("SELECT * FROM opportunities WHERE id = %s", [opportunity_id], fetch="one")
    return format_row(row)


def get_values(data):
    values = []
    for field in ALL_FIELDS:
        value = data[field]
        if field in TEXT_FIELDS:
            value = value.strip()
        values.append(value)
    return values


def not_found(opportunity_id):
    return jsonify({"error": f"Opportunity with ID {opportunity_id} was not found"}), 404


def bad_request(message, details=None):
    body = {"error": message}
    if details:
        body["details"] = details
    return jsonify(body), 400


@app.route("/")
def home():
    return app.send_static_file("index.html")


@app.route("/api/opportunities", methods=["POST"])
def create_opportunity():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return bad_request("Request body must be a valid JSON object")

    data.setdefault("status", "Open")
    errors = validate_opportunity(data)
    if errors:
        return bad_request("Validation failed", errors)

    new_id = run_query(
        """INSERT INTO opportunities
               (title, description, research_area, faculty_name, department,
                required_skills, available_positions, application_deadline, status)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        get_values(data),
    )
    return jsonify({
        "message": "Opportunity created successfully",
        "opportunity": find_opportunity(new_id),
    }), 201


@app.route("/api/opportunities", methods=["GET"])
def get_all_opportunities():
    rows = run_query("SELECT * FROM opportunities ORDER BY id DESC", fetch="all")
    return jsonify([format_row(row) for row in rows]), 200


@app.route("/api/opportunities/<int:opportunity_id>", methods=["GET"])
def get_one_opportunity(opportunity_id):
    opportunity = find_opportunity(opportunity_id)
    if opportunity is None:
        return not_found(opportunity_id)
    return jsonify(opportunity), 200


@app.route("/api/opportunities/<int:opportunity_id>", methods=["PUT"])
def update_opportunity(opportunity_id):
    opportunity = find_opportunity(opportunity_id)
    if opportunity is None:
        return not_found(opportunity_id)

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return bad_request("Request body must be a valid JSON object")

    changes = {field: data[field] for field in ALL_FIELDS if field in data}
    if not changes:
        return bad_request("Send at least one field to update")
    opportunity.update(changes)

    errors = validate_opportunity(opportunity)
    if errors:
        return bad_request("Validation failed", errors)

    run_query(
        """UPDATE opportunities
           SET title = %s, description = %s, research_area = %s, faculty_name = %s,
               department = %s, required_skills = %s, available_positions = %s,
               application_deadline = %s, status = %s
           WHERE id = %s""",
        get_values(opportunity) + [opportunity_id],
    )
    return jsonify({
        "message": "Opportunity updated successfully",
        "opportunity": find_opportunity(opportunity_id),
    }), 200


@app.route("/api/opportunities/<int:opportunity_id>", methods=["DELETE"])
def delete_opportunity(opportunity_id):
    if find_opportunity(opportunity_id) is None:
        return not_found(opportunity_id)

    run_query("DELETE FROM opportunities WHERE id = %s", [opportunity_id])
    return jsonify({"message": f"Opportunity {opportunity_id} deleted successfully"}), 200


# Only reached for non-numeric IDs; numeric ones match the <int:opportunity_id> routes above.
@app.route("/api/opportunities/<opportunity_id>", methods=["GET", "PUT", "DELETE"])
def invalid_id(opportunity_id):
    return bad_request("The opportunity ID in the URL must be a whole number")


@app.errorhandler(Exception)
def handle_error(error):
    if isinstance(error, HTTPException):
        return jsonify({"error": error.description}), error.code

    print("Server error:", error, flush=True)
    return jsonify({"error": "Internal server error. Please try again later."}), 500


if __name__ == "__main__":
    try:
        get_connection().close()
        print("Connected to the MySQL database.", flush=True)
    except Exception as error:
        print("WARNING: could not connect to MySQL:", error)
        print("Check that MySQL is running and that the details in backend/.env are correct.", flush=True)

    app.run(port=int(os.getenv("PORT") or 5000))
