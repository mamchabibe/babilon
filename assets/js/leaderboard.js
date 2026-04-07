(function () {
  const leaderboardBody = document.getElementById("leaderboardBody");
  const leaderboardFeedback = document.getElementById("leaderboardFeedback");

  if (!leaderboardBody || !leaderboardFeedback) {
    return;
  }

  const auth = window.BabilonAuth;

  function setFeedback(message, type) {
    leaderboardFeedback.textContent = message;
    leaderboardFeedback.classList.remove("is-error", "is-success");

    if (type) {
      leaderboardFeedback.classList.add(type === "error" ? "is-error" : "is-success");
    }
  }

  function normalizeErrorMessage(error) {
    const rawMessage = error && error.message ? error.message : "Could not load the leaderboard right now.";

    if (rawMessage.includes("leaderboard_entries")) {
      return "The leaderboard table is missing in Supabase. Re-run supabase/teams_schema.sql, then refresh this page.";
    }

    if (rawMessage.includes("current_floor") || rawMessage.includes("solved_levels") || rawMessage.includes("total_points")) {
      return "The team progress columns are missing in Supabase. Re-run supabase/teams_schema.sql, then refresh this page.";
    }

    return rawMessage;
  }

  async function initLeaderboard() {
    try {
      auth.wireLogoutButtons();

      const authState = await auth.requireAuth();

      if (!authState) {
        return;
      }

      const team = await auth.fetchCurrentTeam(authState.client, authState.user.id);

      auth.setTeamName(team.group_name || "Your team");
      auth.setTeamMeta(`${team.current_floor || 1} active floor`);

      const { data, error } = await authState.client
        .from("leaderboard_entries")
        .select("team_id, group_name, current_floor, total_points, solved_levels, updated_at")
        .order("total_points", { ascending: false })
        .order("current_floor", { ascending: false })
        .order("updated_at", { ascending: true });

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        leaderboardBody.innerHTML = `
          <tr>
            <td colspan="5" class="table-empty">No teams have entered the leaderboard yet.</td>
          </tr>
        `;
        setFeedback("No leaderboard entries yet. The first team registration will populate this board.", "success");
        return;
      }

      leaderboardBody.innerHTML = data
        .map((row, index) => {
          const isCurrentTeam = row.team_id === team.id;

          return `
            <tr class="${isCurrentTeam ? "is-you" : ""}">
              <td>${index + 1}</td>
              <td>${row.group_name}${isCurrentTeam ? ' <span class="status-chip">You</span>' : ""}</td>
              <td>${row.current_floor}</td>
              <td>${row.total_points}</td>
              <td>${row.solved_levels}</td>
            </tr>
          `;
        })
        .join("");

      setFeedback("Leaderboard loaded successfully.", "success");
    } catch (error) {
      setFeedback(normalizeErrorMessage(error), "error");
    }
  }

  initLeaderboard();
})();
