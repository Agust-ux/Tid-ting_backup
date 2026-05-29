export async function requireAuth() {
    const { data: { user } } =
        await supabase.auth.getUser();

    if (!user) {
        window.location.href = "/index.html";
        return null;
    }

    return user;
}