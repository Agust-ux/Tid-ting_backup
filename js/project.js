document.addEventListener("DOMContentLoaded", () => {

const projectId = new URLSearchParams(window.location.search).get("id");

let editingTaskId = null;

// =========================
// DOM
// =========================
const taskList = document.getElementById("taskList");
const addBtn = document.getElementById("addTaskBtn");

const editModal = document.getElementById("editModal");
const editTitle = document.getElementById("editTitle");
const editDescription = document.getElementById("editDescription");
const editPriority = document.getElementById("editPriority");
const editDueDate = document.getElementById("editDueDate");

// =========================
// AUTH CHECK
// =========================
async function requireAuth() {

    const { data: { user } } =
        await supabaseClient.auth.getUser();

    if (!user) {
        window.location.href = "/index.html";
        return null;
    }

    return user;
}

// =========================
// LOAD PROJECT (HEADER)
// =========================
async function loadProject() {

    const { data, error } = await supabaseClient
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

    if (error || !data) {
        console.error(error);
        return;
    }

    const projectTitleEl = document.getElementById("projectTitle");
    const projectDescriptionEl = document.getElementById("projectDescription");
    const hero = document.querySelector(".project-hero");

    projectTitleEl.textContent = data.title;
    projectDescriptionEl.textContent = data.description || "";

    const color = data.color || "#80df6d";

    hero.style.background = `
        linear-gradient(135deg, ${color}22, ${color}10)
    `;

    hero.style.border = `2px solid ${color}`;
}

// =========================
// LOAD TASKS
// =========================
async function loadTasks() {

    const { data, error } = await supabaseClient
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("id", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    taskList.innerHTML = "";
    data.forEach(renderTask);
}

// =========================
// RENDER TASK
// =========================
function renderTask(task) {

    const div = document.createElement("div");
    div.className = `task-card ${task.completed ? "done" : ""}`;

    div.innerHTML = `
        <div class="task-header">
            <h3>${task.title}</h3>
            <span class="priority ${task.priority}">
                ${task.priority}
            </span>
        </div>

        <p>${task.description || ""}</p>

        <small>
            ${task.due_date ? new Date(task.due_date).toLocaleString() : "No date"}
        </small>

        <div class="task-actions">
            <button class="done-btn">
                ${task.completed ? "Undo" : "Done"}
            </button>

            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        </div>
    `;

    // =========================
    // DONE TOGGLE
    // =========================
    div.querySelector(".done-btn").onclick = async () => {

        await supabaseClient
            .from("tasks")
            .update({ completed: !task.completed })
            .eq("id", task.id);

        loadTasks();
    };

    // =========================
    // DELETE
    // =========================
    div.querySelector(".delete-btn").onclick = async () => {

        await supabaseClient
            .from("tasks")
            .delete()
            .eq("id", task.id);

        loadTasks();
    };

    // =========================
    // EDIT
    // =========================
    div.querySelector(".edit-btn").onclick = () => {

        editingTaskId = task.id;

        editTitle.value = task.title;
        editDescription.value = task.description || "";
        editPriority.value = task.priority || "medium";
        editDueDate.value = task.due_date
            ? new Date(task.due_date).toISOString().slice(0,16)
            : "";

        editModal.classList.remove("hidden");
    };

    taskList.appendChild(div);
}

// =========================
// SAVE EDIT TASK
// =========================
document.getElementById("saveEdit").onclick = async () => {

    await supabaseClient
        .from("tasks")
        .update({
            title: editTitle.value,
            description: editDescription.value,
            priority: editPriority.value,
            due_date: editDueDate.value
        })
        .eq("id", editingTaskId);

    editModal.classList.add("hidden");
    editingTaskId = null;

    loadTasks();
};

// =========================
// CLOSE MODAL
// =========================
document.getElementById("closeEdit").onclick = () => {
    editModal.classList.add("hidden");
};

// =========================
// ADD TASK
// =========================
addBtn.onclick = async () => {

    const title = document.getElementById("taskTitle").value;

    if (!title) return alert("Title required");

    await supabaseClient
        .from("tasks")
        .insert([{
            project_id: projectId,
            title,
            description: document.getElementById("taskDescription").value,
            priority: document.getElementById("taskPriority").value,
            due_date: document.getElementById("taskDueDate").value
        }]);

    loadTasks();
};

// =========================
// INIT
// =========================
(async function init() {

    const user = await requireAuth();
    if (!user) return;

    loadProject();
    loadTasks();

})();
});