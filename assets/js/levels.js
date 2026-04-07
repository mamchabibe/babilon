(function () {
  const summaryFeedback = document.getElementById("levelsFeedback");
  const floorsContainer = document.getElementById("towerFloors");

  if (!summaryFeedback || !floorsContainer) {
    return;
  }

  const auth = window.BabilonAuth;

  function setFeedback(message, type) {
    summaryFeedback.textContent = message;
    summaryFeedback.classList.remove("is-error", "is-success");

    if (type) {
      summaryFeedback.classList.add(type === "error" ? "is-error" : "is-success");
    }
  }

  function normalizeErrorMessage(error) {
    const rawMessage = error && error.message ? error.message : "Could not load the tower floors right now.";

    if (rawMessage.includes("current_floor") || rawMessage.includes("solved_levels") || rawMessage.includes("total_points")) {
      return "The team progress columns are missing in Supabase. Re-run supabase/teams_schema.sql, then refresh this page.";
    }

    return rawMessage;
  }

  function renderFloors(currentFloor) {
    const floorNames = [
      "Threshold Gate",
      "Hall of Signals",
      "Archive Bridge",
      "Cipher Workshop",
      "Mirror Corridor",
      "Astral Library",
      "House of Codes",
      "Clocktower Vault",
      "Echo Chamber",
      "Crown Terrace",
      "Sky Furnace",
      "Summit Seal"
    ];

    floorsContainer.innerHTML = floorNames
      .map((name, index) => {
        const floorNumber = index + 1;
        let stateClass = "is-locked";
        let stateLabel = "Locked";

        if (floorNumber < currentFloor) {
          stateClass = "is-cleared";
          stateLabel = "Cleared";
        } else if (floorNumber === currentFloor) {
          stateClass = "is-current";
          stateLabel = "Current floor";
        }

        return `
          <article class="tower-card ${stateClass}">
            <div class="tower-card-top">
              <span class="tower-floor-number">Floor ${floorNumber}</span>
              <span class="status-chip">${stateLabel}</span>
            </div>
            <h3>${name}</h3>
            <p>${floorNumber === currentFloor ? "This is the active puzzle floor for your team right now." : floorNumber < currentFloor ? "Your team has already crossed this floor." : "Unlock this floor by clearing the ones below it."}</p>
          </article>
        `;
      })
      .join("");
  }

  async function initLevelsPage() {
    try {
      auth.wireLogoutButtons();

      const authState = await auth.requireAuth();

      if (!authState) {
        return;
      }

      const team = await auth.fetchCurrentTeam(authState.client, authState.user.id);
      const teamName = team.group_name || "Your team";
      const playerCount = Array.isArray(team.player_names) ? team.player_names.length : 0;

      auth.setTeamName(teamName);
      auth.setTeamMeta(`${playerCount} players in this group`);

      document.getElementById("teamFloor").textContent = String(team.current_floor || 1);
      document.getElementById("teamPoints").textContent = String(team.total_points || 0);
      document.getElementById("teamSolved").textContent = String(team.solved_levels || 0);

      renderFloors(team.current_floor || 1);
      setFeedback("Team access verified. Your tower view is ready.", "success");
    } catch (error) {
      setFeedback(normalizeErrorMessage(error), "error");
    }
  }

  initLevelsPage();
})();
