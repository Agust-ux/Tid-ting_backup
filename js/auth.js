// =========================
// SUPABASE CLIENT CHECK
// =========================

if (!window.supabase) {
    console.error("Supabase is not loaded. Check script order in HTML.");
}

// If you already created supabaseClient in supabase.js, use it
const supabaseClient = window.supabaseClient || supabase;

// =========================
// AUTH HELPERS
// =========================

async function getUser() {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error) {
        console.error("Auth error:", error);
        return null;
    }

    return data?.user || null;
}

// Global function (IMPORTANT for your other scripts)
window.getUser = getUser;

// =========================
// REQUIRE AUTH (PROTECTED PAGES)
// =========================

async function requireAuth() {
    const user = await getUser();

    if (!user) {
        // redirect to login if not authenticated
        window.location.href = "/index.html";
        return null;
    }

    return user;
}

// Expose globally so script.js can use it
window.requireAuth = requireAuth;

// =========================
// OPTIONAL: LOG OUT FUNCTION
// =========================

async function logout() {
    await supabaseClient.auth.signOut();
    window.location.href = "/index.html";
}

window.logout = logout;