let userId = null;

// =========================
// DOM
// =========================
const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");
const addBtn = document.getElementById("addBtn");

// =========================
// AUTH
// =========================
async function requireAuth() {

    const { data: { user } } =
        await supabaseClient.auth.getUser();

    if (!user) {
        window.location.href = "/index.html";
        return null;
    }

    userId = user.id;
    return user;
}

// =========================
// LOAD REMINDERS
// =========================
async function loadReminders() {

    const { data, error } = await supabaseClient
        .from("reminders")
        .select("*")
        .eq("user_id", userId)
        .order("id", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    listContainer.innerHTML = "";

    if (!data || data.length === 0) {
        listContainer.innerHTML = `
            <p class="empty">Ingen påminnelser enda ✨</p>
        `;
        return;
    }

    data.forEach(reminder => {
        listContainer.appendChild(createReminderElement(reminder));
    });
}

// =========================
// FORMAT DATE
// =========================
function formatDate(dateString) {

    const date = new Date(dateString);

    return date.toLocaleString("no-NO", {
        dateStyle: "short",
        timeStyle: "short"
    });
}

// =========================
// CREATE ELEMENT
// =========================
function createReminderElement(reminder) {

    const li = document.createElement("li");
    li.dataset.id = reminder.id;

    if (reminder.completed) {
        li.classList.add("checked");
    }

    li.innerHTML = `
        ${reminder.title}

        <small class="reminder-time">
            ${formatDate(reminder.remind_at)}
        </small>

        <span>&times;</span>
    `;

    return li;
}

// =========================
// ADD REMINDER
// =========================
async function addReminder() {

    const value = inputBox.value.trim();
    if (!value) return alert("Feltet kan ikke være tomt");

    const { error } = await supabaseClient
        .from("reminders")
        .insert([{
            user_id: userId,
            title: value,
            remind_at: new Date().toISOString()
        }]);

    if (error) {
        console.error(error);
        return;
    }

    inputBox.value = "";
    loadReminders();
}

// =========================
// EVENTS
// =========================
addBtn.addEventListener("click", addReminder);

inputBox.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        addReminder();
    }
});

// =========================
// TOGGLE / DELETE
// =========================
listContainer.addEventListener("click", async (e) => {

    const li = e.target.closest("li");
    if (!li) return;

    const id = li.dataset.id;

    // DELETE
    if (e.target.tagName === "SPAN") {

        await supabaseClient
            .from("reminders")
            .delete()
            .eq("id", id);

        loadReminders();
        return;
    }

    // TOGGLE COMPLETE
    const { data: current } = await supabaseClient
        .from("reminders")
        .select("completed")
        .eq("id", id)
        .single();

    await supabaseClient
        .from("reminders")
        .update({ completed: !current.completed })
        .eq("id", id);

    loadReminders();
});

// =========================
// INIT
// =========================
(async function init() {

    const user = await requireAuth();
    if (!user) return;

    loadReminders();

})();