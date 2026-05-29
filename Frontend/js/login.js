document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const errorEl = document.getElementById("error");
    errorEl.textContent = "";

    try {
        const res = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            errorEl.textContent = data.error || "Login failed";
            return;
        }

        // success → go to dashboard
        window.location.href = "/dashboard.html";

    } catch (err) {
        errorEl.textContent = "Server error";
    }
});