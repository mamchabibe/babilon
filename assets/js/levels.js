(function () {
  const summaryFeedback = document.getElementById("levelsFeedback");
  const floorsContainer = document.getElementById("towerFloors");
  const teamRoster = document.querySelector("[data-team-roster]");

  if (!summaryFeedback || !floorsContainer) {
    return;
  }

  const auth = window.BabilonAuth;
  const floorData = window.BabilonFloors;

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

  function renderFloors(team) {
    const floors = floorData && Array.isArray(floorData.floors) ? floorData.floors : [];
    const solvedLevels = Number(team.solved_levels || 0);
    const currentFloor = Math.max(1, Number(team.current_floor || 1));

    floorsContainer.innerHTML = floors
      .map((floor) => {
        const isCleared = solvedLevels >= floor.number;
        const isCurrent = !isCleared && floor.number === currentFloor;
        const isUnlocked = isCleared || isCurrent;
        const stateClass = isCleared ? "is-cleared" : isCurrent ? "is-current" : "is-locked";
        const stateLabel = isCleared ? "Cleared" : isCurrent ? "Current floor" : "Locked";
        const actionMarkup = isUnlocked
          ? `<a class="tower-link" href="floor.html?floor=${floor.number}">${isCleared ? "Revisit floor" : "Enter floor"}</a>`
          : `<span class="tower-link is-disabled">Locked</span>`;

        return `
          <article class="tower-card ${stateClass}">
            <div class="tower-card-top">
              <span class="tower-floor-number">Floor ${floor.number}</span>
              <span class="status-chip">${stateLabel}</span>
            </div>
            <h3>${floor.title}</h3>
            <p>${isCurrent ? "This gate is open to your team right now." : isCleared ? "Your team has already passed through this floor." : "Complete the previous floor to unlock this one."}</p>
            <div class="tower-card-meta">
              <span>${floor.points} pts</span>
              <span>${actionMarkup}</span>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function setRoster(playerNames) {
    if (!teamRoster) {
      return;
    }

    if (!playerNames.length) {
      teamRoster.textContent = "No player names listed yet.";
      return;
    }

    teamRoster.textContent = `Players: ${playerNames.join(", ")}`;
  }

  function setSummary(team, totalFloors) {
    const solvedLevels = Number(team.solved_levels || 0);
    const currentFloor = Number(team.current_floor || 1);
    const floorLabel = solvedLevels >= totalFloors ? `Complete (${totalFloors}/${totalFloors})` : String(currentFloor);

    document.getElementById("teamFloor").textContent = floorLabel;
    document.getElementById("teamPoints").textContent = String(team.total_points || 0);
    document.getElementById("teamSolved").textContent = String(solvedLevels);
  }

  async function initLevelsPage() {
    try {
      auth.wireLogoutButtons();

      const authState = await auth.requireAuth();

      if (!authState) {
        return;
      }

      const team = await auth.fetchCurrentTeam(authState.client, authState.user);
      const playerNames = auth.normalizePlayerNames(team.player_names);
      const playerCount = playerNames.length;
      const totalFloors = floorData && Array.isArray(floorData.floors) ? floorData.floors.length : 0;

      auth.setTeamName(team.group_name || "Your team");
      auth.setTeamMeta(playerCount ? `${playerCount} players in this group` : "Team profile loaded");
      setRoster(playerNames);
      setSummary(team, totalFloors);
      renderFloors(team);
      setFeedback("Team access verified. Your tower view is ready.", "success");
    } catch (error) {
      setFeedback(normalizeErrorMessage(error), "error");
    }
  }

  initLevelsPage();
})();
