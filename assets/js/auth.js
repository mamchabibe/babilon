(function () {
  function getClient() {
    return window.BabilonSupabase ? window.BabilonSupabase.getClient() : null;
  }

  function getNextTarget() {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    return next && next.trim() ? next : "levels.html";
  }

  async function requireAuth() {
    const client = getClient();

    if (!client) {
      throw new Error("Supabase is not configured yet.");
    }

    const {
      data: { session },
      error: sessionError
    } = await client.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (!session) {
      const currentPage = window.location.pathname.split("/").pop() || "levels.html";
      window.location.href = `login.html?next=${encodeURIComponent(currentPage)}`;
      return null;
    }

    const {
      data: { user },
      error: userError
    } = await client.auth.getUser();

    if (userError) {
      throw userError;
    }

    return { client, session, user: user || session.user };
  }

  async function fetchCurrentTeam(client, authUserId) {
    const { data, error } = await client
      .from("teams")
      .select("id, group_name, contact_email, player_names, current_floor, total_points, solved_levels, last_activity_at")
      .eq("auth_user_id", authUserId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async function signOut() {
    const client = getClient();

    if (!client) {
      return;
    }

    await client.auth.signOut();
    window.location.href = "login.html";
  }

  function wireLogoutButtons() {
    document.querySelectorAll("[data-signout]").forEach((button) => {
      button.addEventListener("click", async () => {
        await signOut();
      });
    });
  }

  function setTeamName(name) {
    document.querySelectorAll("[data-team-name]").forEach((node) => {
      node.textContent = name;
    });
  }

  function setTeamMeta(meta) {
    document.querySelectorAll("[data-team-meta]").forEach((node) => {
      node.textContent = meta;
    });
  }

  window.BabilonAuth = {
    getClient,
    getNextTarget,
    requireAuth,
    fetchCurrentTeam,
    signOut,
    wireLogoutButtons,
    setTeamName,
    setTeamMeta
  };
})();
