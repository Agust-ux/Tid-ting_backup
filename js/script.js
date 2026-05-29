let editingProjectId = null;

// =========================
// DOM ELEMENTS
// =========================
const projectModal = document.getElementById("projectModal");
const openProjectModal = document.getElementById("openProjectModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const saveProjectBtn = document.getElementById("saveProjectBtn");
const projectGrid = document.getElementById("projectGrid");

const projectTitle = document.getElementById("projectTitle");
const projectDescription = document.getElementById("projectDescription");
const projectStart = document.getElementById("projectStart");
const projectEnd = document.getElementById("projectEnd");
const projectColor = document.getElementById("projectColor");

// =========================
// SAFETY CHECK (prevents null crashes)
// =========================
if (!projectGrid) {
    console.error("Missing #projectGrid in HTML");
}

// =========================
// AUTH
// =========================
async function requireAuth() {

    const { data: { user }, error } =
        await supabaseClient.auth.getUser();

    if (error) {
        console.error("Auth error:", error);
        return null;
    }

    if (!user) {
        window.location.href = "index.html";
        return null;
    }

    return user;
}

// =========================
// LOAD PROJECTS
// =========================
async function loadProjects() {

    const user = await requireAuth();
    if (!user) return;

    const { data, error } = await supabaseClient
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("id", { ascending: false });

    if (error) {
        console.error("Load projects error:", error);
        return;
    }

    renderProjects(data || []);
}

// =========================
// RENDER PROJECTS
// =========================
function renderProjects(projects) {

    projectGrid.innerHTML = "";

    if (!projects || projects.length === 0) {
        projectGrid.innerHTML = `<p>No projects yet ✨</p>`;
        return;
    }

    projects.forEach(project => {
        const card = createProjectCard(project);
        projectGrid.appendChild(card);
    });
}

// =========================
// CREATE PROJECT CARD
// =========================
function createProjectCard(project) {

    const card = document.createElement("div");
    card.className = "project-card";
    card.style.borderLeft = `12px solid ${project.color || "#4F8EF7"}`;

    const start = project.start_date?.split("T")[0] || "";
    const end = project.end_date?.split("T")[0] || "";

    card.innerHTML = `
        <div class="project-header">
            <div class="project-title">${project.title}</div>

            <div class="menu-wrapper">
                <button class="menu-btn">⋮</button>

                <div class="menu hidden">
                    <button class="menu-item edit">Edit</button>
                    <button class="menu-item delete">Delete</button>
                </div>
            </div>
        </div>

        <p>${project.description || ""}</p>
        <small>${start} → ${end}</small>
    `;

    // =========================
    // OPEN PROJECT PAGE (click card)
    // =========================
    card.addEventListener("click", () => {
        window.location.href = `project.html?id=${project.id}`;
    });

    // =========================
    // MENU TOGGLE
    // =========================
    const menuBtn = card.querySelector(".menu-btn");
    const menu = card.querySelector(".menu");

    menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.classList.toggle("hidden");
    });

    document.addEventListener("click", () => {
        menu.classList.add("hidden");
    });

    // =========================
    // EDIT
    // =========================
    card.querySelector(".edit").addEventListener("click", (e) => {
        e.stopPropagation();

        editingProjectId = project.id;

        projectTitle.value = project.title;
        projectDescription.value = project.description || "";
        projectStart.value = project.start_date?.split("T")[0] || "";
        projectEnd.value = project.end_date?.split("T")[0] || "";
        projectColor.value = project.color || "#4F8EF7";

        projectModal.classList.remove("hidden");
    });

    // =========================
    // DELETE
    // =========================
    card.querySelector(".delete").addEventListener("click", async (e) => {
        e.stopPropagation();

        if (!confirm("Delete project?")) return;

        const { error } = await supabaseClient
            .from("projects")
            .delete()
            .eq("id", project.id);

        if (error) {
            console.error("Delete error:", error);
            return;
        }

        await loadProjects();
    });

    return card;
}

// =========================
// OPEN MODAL (new project)
// =========================
if (openProjectModal) {
    openProjectModal.addEventListener("click", () => {

        editingProjectId = null;

        projectTitle.value = "";
        projectDescription.value = "";
        projectStart.value = "";
        projectEnd.value = "";
        projectColor.value = "#4F8EF7";

        projectModal.classList.remove("hidden");
    });
}

// =========================
// CLOSE MODAL
// =========================
if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
        projectModal.classList.add("hidden");
    });
}

// =========================
// SAVE PROJECT
// =========================
if (saveProjectBtn) {
    saveProjectBtn.addEventListener("click", async () => {

        const user = await requireAuth();
        if (!user) return;

        const payload = {
            title: projectTitle.value,
            description: projectDescription.value,
            start_date: projectStart.value,
            end_date: projectEnd.value,
            color: projectColor.value,
            user_id: user.id
        };

        let result;

        if (editingProjectId) {
            result = await supabaseClient
                .from("projects")
                .update(payload)
                .eq("id", editingProjectId);
        } else {
            result = await supabaseClient
                .from("projects")
                .insert([payload]);
        }

        if (result.error) {
            console.error("Save error:", result.error);
            return;
        }

        projectModal.classList.add("hidden");
        await loadProjects();
    });
}

// =========================
// INIT
// =========================
(async function init() {

    const user = await requireAuth();
    if (!user) return;

    await loadProjects();
})();