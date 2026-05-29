async function protectPage() {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        window.location.href = "index.html";
    }

    return user;
}