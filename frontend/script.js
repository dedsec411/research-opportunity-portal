// The port must match PORT in backend/.env.
const API_URL = "http://127.0.0.1:5000/api/opportunities";

const FIELDS = ["title", "faculty_name", "department", "research_area", "available_positions",
                "required_skills", "application_deadline", "status", "description"];

const form = document.getElementById("opportunity-form");
const list = document.getElementById("opportunity-list");
const details = document.getElementById("details");
const message = document.getElementById("message");

let editingId = null;
let messageTimer = null;


async function callApi(url, method = "GET", body = null) {
  const options = { method: method };
  if (body !== null) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { ok: response.ok, status: response.status, data: data };
  } catch (error) {
    return { ok: false, status: 0, data: { error: "Cannot reach the server at " + API_URL + ". Check that the backend is running." } };
  }
}

function showMessage(text, type) {
  message.textContent = text;
  message.className = "message " + type;
  clearTimeout(messageTimer);
  messageTimer = setTimeout(function () { message.classList.add("hidden"); }, 6000);
}

function showApiError(result) {
  let text = result.data.error || "Something went wrong";
  if (result.data.details) {
    text += ": " + result.data.details.join(", ");
  }
  if (result.status) {
    text = "Error " + result.status + ": " + text;
  }
  showMessage(text, "error");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function statusBadge(status) {
  return `<span class="badge ${status.toLowerCase()}">${status}</span>`;
}


async function loadOpportunities() {
  const result = await callApi(API_URL);
  if (!result.ok) {
    showApiError(result);
    return;
  }

  let rows = "";
  for (const item of result.data) {
    const closeButton = item.status === "Open"
      ? `<button class="btn btn-small" onclick="closeOpportunity(${item.id})">Close</button>`
      : "";

    rows += `
      <tr>
        <td>${item.id}</td>
        <td class="title-cell">
          <strong>${escapeHtml(item.title)}</strong>
          <div class="sub">${escapeHtml(item.faculty_name)}, ${escapeHtml(item.department)}</div>
        </td>
        <td>${item.application_deadline}</td>
        <td>${item.available_positions}</td>
        <td>${statusBadge(item.status)}</td>
        <td>
          <button class="btn btn-small" onclick="viewOpportunity(${item.id})">View</button>
          <button class="btn btn-small" onclick="startEdit(${item.id})">Edit</button>
          ${closeButton}
          <button class="btn btn-small btn-danger" onclick="deleteOpportunity(${item.id})">Delete</button>
        </td>
      </tr>`;
  }
  list.innerHTML = rows;
  document.getElementById("empty-note").classList.toggle("hidden", result.data.length > 0);
}


async function viewOpportunity(id) {
  const result = await callApi(API_URL + "/" + id);
  if (!result.ok) {
    hideDetails();
    showApiError(result);
    return;
  }

  const item = result.data;
  details.innerHTML = `
    <div class="panel-head">
      <h2>Opportunity details</h2>
      <button class="btn btn-small" onclick="hideDetails()">Hide details</button>
    </div>
    <h3>${escapeHtml(item.title)} ${statusBadge(item.status)}</h3>
    <dl class="details-list">
      <dt>ID</dt>                   <dd>${item.id}</dd>
      <dt>Faculty member</dt>       <dd>${escapeHtml(item.faculty_name)}</dd>
      <dt>Department</dt>           <dd>${escapeHtml(item.department)}</dd>
      <dt>Research area</dt>        <dd>${escapeHtml(item.research_area)}</dd>
      <dt>Required skills</dt>      <dd>${escapeHtml(item.required_skills)}</dd>
      <dt>Available positions</dt>  <dd>${item.available_positions}</dd>
      <dt>Application deadline</dt> <dd>${item.application_deadline}</dd>
      <dt>Description</dt>          <dd>${escapeHtml(item.description)}</dd>
    </dl>`;
  details.classList.remove("hidden");
  details.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function hideDetails() {
  details.classList.add("hidden");
}

document.getElementById("search-form").addEventListener("submit", function (event) {
  event.preventDefault();
  const id = document.getElementById("search-id").value.trim();
  if (!/^\d+$/.test(id)) {
    showMessage("Enter an opportunity ID (a whole number) to search", "error");
    return;
  }
  viewOpportunity(id);
});


function validateForm() {
  const missing = [];
  for (const name of FIELDS) {
    const input = form.elements[name];
    const isEmpty = input.value.trim() === "";
    input.classList.toggle("invalid", isEmpty);
    if (isEmpty) {
      missing.push(input.labels[0].textContent);
    }
  }
  if (missing.length > 0) {
    showMessage("Please fill in: " + missing.join(", "), "error");
    return false;
  }

  const positions = Number(form.elements.available_positions.value);
  if (!Number.isInteger(positions) || positions < 1 || positions > 1000) {
    form.elements.available_positions.classList.add("invalid");
    showMessage("Available positions must be a whole number between 1 and 1000", "error");
    return false;
  }
  return true;
}


form.addEventListener("submit", async function (event) {
  event.preventDefault();
  if (!validateForm()) {
    return;
  }

  const data = {};
  for (const name of FIELDS) {
    data[name] = form.elements[name].value.trim();
  }
  data.available_positions = Number(data.available_positions);

  const saveButton = document.getElementById("save-button");
  saveButton.disabled = true;
  let result;
  if (editingId === null) {
    result = await callApi(API_URL, "POST", data);
  } else {
    result = await callApi(API_URL + "/" + editingId, "PUT", data);
  }
  saveButton.disabled = false;

  if (!result.ok) {
    showApiError(result);
    if (result.status === 404) {
      afterChange(editingId);
    }
    return;
  }
  showMessage(result.data.message, "success");
  resetForm();
  hideDetails();
  loadOpportunities();
});

async function startEdit(id) {
  const result = await callApi(API_URL + "/" + id);
  if (!result.ok) {
    showApiError(result);
    loadOpportunities();
    return;
  }

  resetForm();
  for (const name of FIELDS) {
    form.elements[name].value = result.data[name];
  }
  editingId = id;
  document.getElementById("form-title").textContent = "Edit opportunity #" + id;
  document.getElementById("save-button").textContent = "Save changes";
  document.getElementById("cancel-button").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm() {
  form.reset();
  editingId = null;
  document.getElementById("form-title").textContent = "Post a new opportunity";
  document.getElementById("save-button").textContent = "Post opportunity";
  document.getElementById("cancel-button").classList.add("hidden");
  for (const name of FIELDS) {
    form.elements[name].classList.remove("invalid");
  }
}

document.getElementById("cancel-button").addEventListener("click", resetForm);


async function closeOpportunity(id) {
  const result = await callApi(API_URL + "/" + id, "PUT", { status: "Closed" });
  if (!result.ok) {
    showApiError(result);
  } else {
    showMessage("Opportunity #" + id + " is now Closed", "success");
  }
  afterChange(id);
}


async function deleteOpportunity(id) {
  if (!confirm("Delete opportunity #" + id + "? This cannot be undone.")) {
    return;
  }

  const result = await callApi(API_URL + "/" + id, "DELETE");
  if (!result.ok) {
    showApiError(result);
  } else {
    showMessage(result.data.message, "success");
  }
  afterChange(id);
}

function afterChange(id) {
  if (editingId === id) {
    resetForm();
  }
  hideDetails();
  loadOpportunities();
}


loadOpportunities();
