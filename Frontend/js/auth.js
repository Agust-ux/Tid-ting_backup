async function requireAuth() {

    const { data, error } =
        await supabaseClient.auth.getUser();

    if (error || !data.user) {
        window.location.href = "/index.html";
        return null;
    }

    return data.user;
}