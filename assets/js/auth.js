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
    const authUser = authUserId && typeof authUserId === "object" ? authUserId : null;
    const resolvedAuthUserId = authUser ? authUser.id : authUserId;
    const { data, error } = await client
      .from("teams")
      .select("id, group_name, contact_email, player_names, current_floor, total_points, solved_levels, last_activity_at")
      .eq("auth_user_id", resolvedAuthUserId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return {
        ...data,
        player_names: normalizePlayerNames(data.player_names)
      };
    }

    let user = authUser;

    if (!user) {
      const {
        data: userData,
        error: userError
      } = await client.auth.getUser();

      if (userError) {
        throw userError;
      }

      user = userData ? userData.user : null;
    }

    return buildFallbackTeam(user);
  }

  function normalizePlayerNames(value) {
    if (Array.isArray(value)) {
      return value.map((name) => String(name || "").trim()).filter(Boolean);
    }

    if (typeof value === "string") {
      return value
        .split(/\r?\n|,/)
        .map((name) => name.trim())
        .filter(Boolean);
    }

    return [];
  }

  function buildFallbackTeam(user) {
    const metadata = user && user.user_metadata ? user.user_metadata : {};
    const email = user && user.email ? user.email : "";
    const fallbackName = metadata.group_name || (email ? email.split("@")[0] : "Your team");

    return {
      id: null,
      auth_user_id: user && user.id ? user.id : null,
      group_name: fallbackName,
      contact_email: email,
      player_names: normalizePlayerNames(metadata.player_names),
      current_floor: 1,
      total_points: 0,
      solved_levels: 0,
      last_activity_at: null
    };
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
    normalizePlayerNames,
    signOut,
    wireLogoutButtons,
    setTeamName,
    setTeamMeta
  };
})();
