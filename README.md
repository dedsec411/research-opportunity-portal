# Research Opportunity Portal

A web application where faculty members can post, view, update, close and delete
research opportunities in one place. It has a REST API (Python and Flask), a MySQL
database and a simple frontend (HTML, CSS and JavaScript).

- **Course:** CN, Assignment 1 (BS AI 5A, Fall 2026)
- **Name:** Wasiq Ahmed
- **Reg. No:** P24-0010

**GitHub Repository:**
https://github.com/dedsec411/research-opportunity-portal

**Demo video:**
PASTE-YOUR-VIDEO-LINK-HERE

## Features

- Post a new research opportunity through a form
- See all opportunities in a table, newest first
- See the complete details of one opportunity (View button or Find by ID)
- Edit an opportunity
- Change the status of an opportunity from Open to Closed
- Delete an opportunity
- Success and error messages, including 404 Not Found
- Required fields are checked in the browser and again in the API

## Technologies

| Part     | Technology                         |
|----------|------------------------------------|
| Backend  | Python 3, Flask                    |
| Database | MySQL (connected with PyMySQL)     |
| Frontend | HTML, CSS, JavaScript              |
| Testing  | Postman                            |

## Project structure

```
research-opportunity-portal/
├── backend/
│   ├── app.py              REST API routes
│   ├── db.py               MySQL connection and query helper
│   ├── validation.py       checks the data sent by the client
│   ├── requirements.txt    Python packages
│   └── .env.example        template for the database settings
├── database/
│   └── schema.sql          creates the database and the table
├── frontend/
│   ├── index.html          page layout
│   ├── style.css           styling
│   └── script.js           calls the API with fetch()
├── postman/
│   └── research-opportunity-portal.postman_collection.json
├── .gitignore
└── README.md
```

## Setup and run instructions

You need **Python 3.9 or newer** and **MySQL** (MySQL Server 8, or the MySQL that comes with XAMPP).

### 1. Create the database

Run the file `database/schema.sql` once. Use any one of these ways:

- **MySQL Workbench:** File > Open SQL Script > choose `database/schema.sql` > click the lightning icon to run it.
- **phpMyAdmin (XAMPP):** open the Import tab > choose `database/schema.sql` > click Import (or Go).
- **Command line:** open a terminal in the project folder and run

  ```
  mysql -u root -p
  ```

  type your MySQL password, then inside MySQL run

  ```
  source database/schema.sql
  exit
  ```

This creates a database named `research_portal` with one table named `opportunities`.

### 2. Add your MySQL password

Open a terminal in the project folder and copy the settings template.

Windows:

```
cd backend
copy .env.example .env
```

macOS / Linux:

```
cd backend
cp .env.example .env
```

Open the new `.env` file in any text editor and replace `your_mysql_password` with your own MySQL password.
If your MySQL has no password (the XAMPP default), delete `your_mysql_password` so the line reads `DB_PASSWORD=`

The `.env` file is listed in `.gitignore`, so the password is never uploaded to GitHub.

### 3. Install the Python packages

In the same `backend` folder:

```
python -m pip install -r requirements.txt
```

### 4. Start the server

```
python app.py
```

The terminal should show:

```
Connected to the MySQL database.
 * Running on http://127.0.0.1:5000
```

Keep this terminal open while you use the application.

If the terminal shows `WARNING: could not connect to MySQL` instead, find the message in the
Troubleshooting table at the end of this file. The server reads `.env` only when it starts, so after
correcting `.env`, stop the server with Ctrl+C and run `python app.py` again.

### 5. Open the application

Open **http://127.0.0.1:5000** in a browser. Flask serves the frontend from the same address,
so there is nothing else to start.

## How it works

1. The browser loads the page from `frontend/` and `script.js` calls the API with `fetch()`.
2. `backend/app.py` receives the request and `validation.py` checks the data.
3. `db.py` runs the SQL statement on the MySQL table `opportunities`.
4. The API answers with JSON and an HTTP status code, and the page shows the result.

All data comes from the database. Nothing is hard-coded in the frontend.

## API endpoints

Base URL: `http://127.0.0.1:5000`

| Method | URL                       | What it does                 | Success     | Possible errors |
|--------|---------------------------|------------------------------|-------------|-----------------|
| POST   | `/api/opportunities`      | Create a new opportunity     | 201 Created | 400             |
| GET    | `/api/opportunities`      | Get all opportunities        | 200 OK      |                 |
| GET    | `/api/opportunities/:id`  | Get one opportunity          | 200 OK      | 404             |
| PUT    | `/api/opportunities/:id`  | Update an opportunity        | 200 OK      | 400, 404        |
| DELETE | `/api/opportunities/:id`  | Delete an opportunity        | 200 OK      | 404             |

An ID that is not a whole number, such as `/api/opportunities/abc`, returns **400 Bad Request**.
Any unexpected problem on the server, such as MySQL not running, returns **500 Internal Server Error**.
Every response is JSON.

### Example request body (POST)

```json
{
  "title": "Urdu Speech Recognition using Deep Learning",
  "description": "Build and evaluate a speech-to-text model for Urdu using open datasets.",
  "research_area": "Natural Language Processing",
  "faculty_name": "Dr. Ayesha Khan",
  "department": "Artificial Intelligence",
  "required_skills": "Python, PyTorch, Signal Processing",
  "available_positions": 2,
  "application_deadline": "2026-11-30",
  "status": "Open"
}
```

The `id` is created by MySQL. `status` may be left out when creating; it is then saved as `Open`.

PUT accepts all the fields or only the ones that should change. For example, this body closes an opportunity:

```json
{ "status": "Closed" }
```

### Validation rules

| Field                  | Rule                                         |
|------------------------|----------------------------------------------|
| `title`                | required text, 200 characters or less        |
| `description`          | required text, 2000 characters or less       |
| `research_area`        | required text, 100 characters or less        |
| `faculty_name`         | required text, 100 characters or less        |
| `department`           | required text, 100 characters or less        |
| `required_skills`      | required text, 255 characters or less        |
| `available_positions`  | required whole number between 1 and 1000     |
| `application_deadline` | required date in `YYYY-MM-DD` format         |
| `status`               | `Open` or `Closed`                           |

### Example error responses

```json
{ "error": "Opportunity with ID 99 was not found" }
```

```json
{
  "error": "Validation failed",
  "details": ["title is required", "available_positions must be a whole number between 1 and 1000"]
}
```

## Testing with Postman

1. Start the backend (`python app.py`).
2. In Postman choose Import and select `postman/research-opportunity-portal.postman_collection.json`.
3. Send the requests from top to bottom:

| Request                                 | Expected status |
|-----------------------------------------|-----------------|
| 1a, 1b, 1c. Create three opportunities  | 201             |
| 2. Get all opportunities                | 200             |
| 3. Get one opportunity by ID            | 200             |
| 4. Update an opportunity                | 200             |
| 5. Close an opportunity (Open to Closed)| 200             |
| 6. Delete an opportunity                | 200             |
| 7. Get the deleted opportunity          | 404             |
| 8a. Create with missing fields          | 400             |
| 8b. Create with invalid values          | 400             |

The Create requests save the new IDs in collection variables, so the later requests
always use the right ID.

## Troubleshooting

| Message                                       | What to do                                                                 |
|-----------------------------------------------|----------------------------------------------------------------------------|
| `Access denied for user 'root'@'localhost'`   | The password in `backend/.env` is wrong. Check that `your_mysql_password` was replaced with your real password, then restart the server. |
| `Unknown database 'research_portal'`          | Run `database/schema.sql` (step 1).                                        |
| `Can't connect to MySQL server`               | Start MySQL (Windows Services, or Start in the XAMPP control panel).       |
| `python` is not recognized                    | Use `py` instead of `python` on Windows, or `python3` on macOS / Linux.    |
| `externally-managed-environment` (pip error)  | Create a virtual environment first: `python3 -m venv venv`, then `source venv/bin/activate`, then repeat step 3. |
| Port 5000 is already in use                   | On a Mac, switch off AirPlay Receiver (System Settings > General > AirDrop & Handoff), which uses port 5000. Otherwise set `PORT=5001` in `backend/.env`, change `5000` to `5001` in the `API_URL` line at the top of `frontend/script.js`, restart the server and open http://127.0.0.1:5001. |
