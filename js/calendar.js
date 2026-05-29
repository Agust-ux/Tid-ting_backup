let currentDate = new Date();
let projects = [];
let editingProjectId = null;

// =========================
// SUPABASE AUTH
// =========================
async function getUser() {
    const { data } = await supabaseClient.auth.getUser();
    return data?.user || null;
}

// =========================
// DOM
// =========================
const calendar = document.getElementById("calendar");
const timelines = document.getElementById("timelines");
const monthLabel = document.getElementById("monthLabel");

const modal = document.getElementById("modal");

const addProjectBtn = document.getElementById("addProject");
const saveProjectBtn = document.getElementById("saveProject");
const closeModalBtn = document.getElementById("closeModal");
const deleteProjectBtn = document.getElementById("deleteProject");
const goToProjectBtn = document.getElementById("goToProject");

const titleInput = document.getElementById("titleInput");
const startInput = document.getElementById("startInput");
const endInput = document.getElementById("endInput");
const colorInput = document.getElementById("colorInput");
const notesInput = document.getElementById("notesInput");

// =========================
// SAFETY GUARD
// =========================
if (!calendar || !timelines || !monthLabel || !modal) {
    console.error("Calendar page missing required elements");
}

// =========================
// SUPABASE API
// =========================
const API = {

    async getProjects() {

        const user = await getUser();
        if (!user) return [];

        const { data, error } = await supabaseClient
            .from("projects")
            .select("*")
            .eq("user_id", user.id)
            .order("id", { ascending: true });

        if (error) {
            console.error(error);
            return [];
        }

        return data || [];
    },

    async createProject(payload) {

        const user = await getUser();
        if (!user) return;

        const { error } = await supabaseClient
            .from("projects")
            .insert([{
                ...payload,
                user_id: user.id
            }]);

        if (error) console.error(error);
    },

    async updateProject(id, payload) {

        const { error } = await supabaseClient
            .from("projects")
            .update(payload)
            .eq("id", id);

        if (error) console.error(error);
    },

    async deleteProject(id) {

        const { error } = await supabaseClient
            .from("projects")
            .delete()
            .eq("id", id);

        if (error) console.error(error);
    }
};

// =========================
// DATE HELPERS
// =========================
function toDateOnly(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseDate(str) {
    return toDateOnly(new Date(str));
}

function makeTransparent(hex, alpha) {

    hex = hex.replace("#", "");

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r},${g},${b},${alpha})`;
}

// =========================
// LOAD PROJECTS
// =========================
async function loadProjects() {
    projects = await API.getProjects();
}

// =========================
// CALENDAR MATRIX
// =========================
function getMonthMatrix(year, month) {

    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const totalCells =
        Math.ceil((startOffset + daysInMonth) / 7) * 7;

    const days = [];

    for (let i = 0; i < totalCells; i++) {

        const dayNum = i - startOffset + 1;
        const date = new Date(year, month, dayNum);

        days.push({
            date,
            inMonth: date.getMonth() === month
        });
    }

    return days;
}

// =========================
// RENDER CALENDAR
// =========================
function renderCalendar() {

    calendar.innerHTML = "";
    timelines.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthLabel.textContent =
        currentDate.toLocaleString("default", { month: "long" }) +
        " " +
        year;

    const weekdays = ["MON","TUE","WED","THU","FRI","SAT","SUN"];

    weekdays.forEach(d => {
        const el = document.createElement("div");
        el.className = "weekday";
        el.textContent = d;
        calendar.appendChild(el);
    });

    const days = getMonthMatrix(year, month);
    const cells = [];

    days.forEach((d, index) => {

        const cell = document.createElement("div");
        cell.className = "day";

        if (d.inMonth) {
            cell.textContent = d.date.getDate();
        }

        calendar.appendChild(cell);

        cells.push({
            el: cell,
            date: d.date,
            index
        });
    });

    renderTimelines(cells);
}

// =========================
// TIMELINES
// =========================
function renderTimelines(cells) {

    timelines.innerHTML = "";

    const weekMap = new Map();

    projects.forEach(project => {

        const activeCells = cells.filter(c =>
            c.date >= parseDate(project.start_date) &&
            c.date <= parseDate(project.end_date) &&
            c.el.textContent !== ""
        );

        activeCells.forEach(cell => {

            const weekIndex = Math.floor(cell.index / 7);

            if (!weekMap.has(weekIndex)) {
                weekMap.set(weekIndex, []);
            }

            let rows = weekMap.get(weekIndex);

            let row = rows.find(r => r.project.id === project.id);

            if (!row) {
                row = { project, cells: [] };
                rows.push(row);
            }

            row.cells.push(cell);
        });
    });

    weekMap.forEach(rows => {

        rows.forEach((row, laneIndex) => {

            const sorted = row.cells.sort((a,b) => a.index - b.index);

            const first = sorted[0];
            const last = sorted[sorted.length - 1];

            const timeline = document.createElement("div");
            timeline.className = "timeline";

            timeline.style.background =
                makeTransparent(row.project.color, 0.45);

            const startX = first.el.offsetLeft + 1;
            const endX = last.el.offsetLeft + last.el.offsetWidth - 1;

            timeline.style.left = startX + "px";
            timeline.style.width = (endX - startX) + "px";

            timeline.style.top =
                first.el.offsetTop + 44 + laneIndex * 24 + "px";

            timeline.textContent = row.project.title;

            timeline.addEventListener("click", () => {
                openEditModal(row.project);
            });

            timelines.appendChild(timeline);
        });
    });
}

// =========================
// MODAL (ONLY ONE SYSTEM)
// =========================
function openCreateModal() {

    editingProjectId = null;

    titleInput.value = "";
    startInput.value = "";
    endInput.value = "";
    notesInput.value = "";
    colorInput.value = "#4F8EF7";

    deleteProjectBtn.classList.add("hidden");
    goToProjectBtn.classList.add("hidden");

    modal.classList.remove("hidden");
}

function openEditModal(project) {

    editingProjectId = project.id;

    titleInput.value = project.title;
    startInput.value = project.start_date?.split("T")[0] || "";
    endInput.value = project.end_date?.split("T")[0] || "";
    notesInput.value = project.description || "";
    colorInput.value = project.color;

    deleteProjectBtn.classList.remove("hidden");
    goToProjectBtn.classList.remove("hidden");

    modal.classList.remove("hidden");
}

function closeModal() {
    modal.classList.add("hidden");
}

// =========================
// EVENTS (SAFE)
// =========================
addProjectBtn?.addEventListener("click", openCreateModal);
closeModalBtn?.addEventListener("click", closeModal);

saveProjectBtn?.addEventListener("click", async () => {

    const payload = {
        title: titleInput.value,
        description: notesInput.value,
        start_date: startInput.value,
        end_date: endInput.value,
        color: colorInput.value
    };

    if (editingProjectId) {
        await API.updateProject(editingProjectId, payload);
    } else {
        await API.createProject(payload);
    }

    closeModal();
    await init();
});

deleteProjectBtn?.addEventListener("click", async () => {

    if (!editingProjectId) return;

    await API.deleteProject(editingProjectId);

    closeModal();
    await init();
});

goToProjectBtn?.addEventListener("click", () => {

    if (!editingProjectId) return;

    window.location.href = `project.html?id=${editingProjectId}`;
});

// month navigation
document.getElementById("prevMonth")?.addEventListener("click", async () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    await init();
});

document.getElementById("nextMonth")?.addEventListener("click", async () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    await init();
});

// =========================
// INIT
// =========================
async function init() {

    await loadProjects();
    renderCalendar();
}

init();