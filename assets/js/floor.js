(function () {
  const auth = window.BabilonAuth;
  const floorData = window.BabilonFloors;
  const feedbackNode = document.getElementById("floorFeedback");
  const answerForm = document.getElementById("floorAnswerForm");
  const answerInput = document.getElementById("floorAnswer");
  const submitButton = document.getElementById("floorSubmit");
  const rosterNode = document.querySelector("[data-team-roster]");
  const titleNode = document.getElementById("floorTitle");
  const leadNode = document.getElementById("floorLead");
  const riddleNode = document.getElementById("floorRiddle");
  const pointsNode = document.getElementById("floorPoints");
  const accessStateNode = document.getElementById("floorAccessState");
  const floorNumberLabel = document.getElementById("floorNumberLabel");

  if (
    !auth ||
    !floorData ||
    !feedbackNode ||
    !answerForm ||
    !answerInput ||
    !submitButton ||
    !titleNode ||
    !leadNode ||
    !riddleNode ||
    !pointsNode ||
    !accessStateNode ||
    !floorNumberLabel
  ) {
    return;
  }

  let currentFloorState = null;

  function getRequestedFloorNumber() {
    const params = new URLSearchParams(window.location.search);
    const parsed = Number(params.get("floor"));
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
  }

  function setFeedback(message, type) {
    feedbackNode.textContent = message;
    feedbackNode.classList.remove("is-error", "is-success");

    if (type) {
      feedbackNode.classList.add(type === "error" ? "is-error" : "is-success");
    }
  }

  function setRoster(playerNames) {
    if (!rosterNode) {
      return;
    }

    rosterNode.textContent = playerNames.length
      ? `Players: ${playerNames.join(", ")}`
      : "No player names listed yet.";
  }

  function normalizeErrorMessage(error) {
    const rawMessage = error && error.message ? error.message : "Could not load this floor right now.";

    if (rawMessage.includes("current_floor") || rawMessage.includes("solved_levels") || rawMessage.includes("total_points")) {
      return "The team progress columns are missing in Supabase. Re-run supabase/teams_schema.sql, then refresh this page.";
    }

    return rawMessage;
  }

  function isFloorCleared(team, floorNumber) {
    return Number(team.solved_levels || 0) >= floorNumber;
  }

  function isFloorUnlocked(team, floorNumber) {
    return floorNumber <= Number(team.current_floor || 1) || isFloorCleared(team, floorNumber);
  }

  function renderFloor(team, floor) {
    const isCleared = isFloorCleared(team, floor.number);
    const isUnlocked = isFloorUnlocked(team, floor.number);

    titleNode.textContent = floor.title;
    floorNumberLabel.textContent = `Floor ${floor.number}`;
    leadNode.textContent = isCleared
      ? "This floor has already been cleared by your team. You may revisit the riddle, but its gate is already behind you."
      : isUnlocked
      ? "This chamber is open to your team now. Read with care and answer only when you are certain."
      : "This chamber is sealed. Clear the previous floor before attempting to enter.";
    riddleNode.textContent = floor.riddle;
    pointsNode.textContent = `${floor.points} pts`;
    accessStateNode.textContent = isCleared ? "Cleared" : isUnlocked ? "Unlocked" : "Locked";

    if (!isUnlocked) {
      answerInput.disabled = true;
      submitButton.disabled = true;
      submitButton.textContent = "Floor locked";
      setFeedback("This floor is locked. Return to the current floor and clear it first.", "error");
      return;
    }

    if (isCleared) {
      answerInput.disabled = true;
      submitButton.disabled = true;
      submitButton.textContent = "Floor cleared";
      setFeedback("This floor is already solved for your team.", "success");
      return;
    }

    answerInput.disabled = false;
    submitButton.disabled = false;
    submitButton.textContent = "Submit answer";
    setFeedback("Submit the correct answer to unlock the next floor.", "success");
  }

  function buildUpdatedProgress(team, floor) {
    const totalFloors = floorData.floors.length;
    const solvedLevels = Math.max(Number(team.solved_levels || 0), floor.number);
    const nextFloor = floor.number >= totalFloors ? totalFloors : floor.number + 1;

    return {
      solved_levels: solvedLevels,
      current_floor: Math.max(Number(team.current_floor || 1), nextFloor),
      total_points: floorData.getTotalPointsForSolvedCount(solvedLevels)
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!currentFloorState || !currentFloorState.team || !currentFloorState.floor) {
      return;
    }

    const { team, floor, client } = currentFloorState;

    if (isFloorCleared(team, floor.number)) {
      setFeedback("This floor is already solved for your team.", "success");
      return;
    }

    if (!isFloorUnlocked(team, floor.number)) {
      setFeedback("This floor is still locked for your team.", "error");
      return;
    }

    const submittedAnswer = floorData.normalizeAnswer(answerInput.value);
    const correctAnswer = floorData.normalizeAnswer(floor.answer);

    if (!submittedAnswer) {
      setFeedback("Enter an answer before submitting.", "error");
      return;
    }

    if (submittedAnswer !== correctAnswer) {
      setFeedback("That answer is not correct. Read again and try once more.", "error");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Unlocking next floor...";

    try {
      if (!team.id) {
        throw new Error("This team profile is missing from Supabase. Re-run the team schema and sign in again.");
      }

      const updates = buildUpdatedProgress(team, floor);
      const updatedTeam = await auth.updateTeamProgress(client, team.id, updates);
      const completedAsFinal = floor.number >= floorData.floors.length;
      currentFloorState.team = updatedTeam;

      renderFloor(updatedTeam, floor);
      answerForm.reset();
      setFeedback(
        completedAsFinal
          ? "Correct. The final floor has been cleared."
          : `Correct. Floor ${floor.number + 1} is now unlocked.`,
        "success"
      );
    } catch (error) {
      setFeedback(normalizeErrorMessage(error), "error");
      submitButton.disabled = false;
      submitButton.textContent = "Submit answer";
      return;
    }

    submitButton.disabled = answerInput.disabled;
    submitButton.textContent = answerInput.disabled ? "Floor cleared" : "Submit answer";
  }

  async function initFloorPage() {
    try {
      auth.wireLogoutButtons();

      const requestedFloorNumber = getRequestedFloorNumber();
      const floor = floorData.getFloor(requestedFloorNumber);

      if (!floor) {
        window.location.href = "levels.html";
        return;
      }

      const authState = await auth.requireAuth();

      if (!authState) {
        return;
      }

      const team = await auth.fetchCurrentTeam(authState.client, authState.user);
      const playerNames = auth.normalizePlayerNames(team.player_names);

      auth.setTeamName(team.group_name || "Your team");
      auth.setTeamMeta(playerNames.length ? `${playerNames.length} players in this group` : "Team profile loaded");
      setRoster(playerNames);

      currentFloorState = {
        client: authState.client,
        team,
        floor
      };

      renderFloor(team, floor);
    } catch (error) {
      setFeedback(normalizeErrorMessage(error), "error");
      answerInput.disabled = true;
      submitButton.disabled = true;
    }
  }

  answerForm.addEventListener("submit", handleSubmit);
  initFloorPage();
})();
