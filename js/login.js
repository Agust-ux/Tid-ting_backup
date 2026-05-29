document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");
    const signupBtn = document.getElementById("signupBtn");
    const errorText = document.getElementById("error");

    // Safety check (prevents null crashes)
    if (!loginForm || !errorText) {
        console.error("Login form or error element not found in HTML");
        return;
    }

    // =========================
    // LOGIN
    // =========================
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email")?.value?.trim();
        const password = document.getElementById("password")?.value;

        errorText.textContent = "";

        if (!email || !password) {
            errorText.textContent = "Please enter email and password";
            return;
        }

        // Supabase login
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            errorText.textContent = error.message;
            return;
        }

        // Success → go dashboard
        window.location.href = "dashboard.html";
    });

    // =========================
    // SIGN UP
    // =========================
    if (signupBtn) {
        signupBtn.addEventListener("click", async () => {

            const email = document.getElementById("email")?.value?.trim();
            const password = document.getElementById("password")?.value;

            errorText.textContent = "";

            if (!email || !password) {
                errorText.textContent = "Enter email and password first";
                return;
            }

            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password
            });

            if (error) {
                errorText.textContent = error.message;
                return;
            }

            errorText.textContent =
                "Account created! Check your email or log in.";
        });
    }

});