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
  const answerHintNode = document.getElementById("floorAnswerHint");
  const pointsNode = document.getElementById("floorPoints");
  const accessStateNode = document.getElementById("floorAccessState");
  const floorNumberLabel = document.getElementById("floorNumberLabel");
  const popupNode = document.getElementById("floorCompletionPopup");
  const popupKickerNode = document.getElementById("floorPopupKicker");
  const popupTitleNode = document.getElementById("floorPopupTitle");
  const popupMessageNode = document.getElementById("floorPopupMessage");
  const popupCloseButton = document.getElementById("floorPopupClose");
  const popupTriggerButton = document.getElementById("floorPopupTrigger");
  const floorEventOverlay = document.getElementById("floorEventOverlay");
  const floorEventMessage = document.getElementById("floorEventMessage");
  const floorEventDismiss = document.getElementById("floorEventDismiss");
  const floorPopupMessages = {
    1: {
      title: "You Look Familiar",
      message:
        "Thou hast done well. There is in thee a likeness I have seen before -- not of face, but of hunger. The fragment answereth only to those who were meant to notice it."
    },
    2: {
      title: "All Shall Be One",
      message:
        "The scattered are many, yet the worthy must learn another way. No great work is raised by divided hands, and no lasting design is born of wandering minds."
    },
    3: {
      title: "The Golden Tongue",
      message:
        "Thou hast touched the edge of an older mystery. There was once a strength in speech that men have long forgotten, and even now its echo shineth among the faithful seeker."
    },
    4: {
      title: "I Understand You",
      message:
        "I have watched thy steps, and now I know thee better. Each soul revealeth its measure in trial, and every worthy mind hath its place when the design is rightly set."
    },
    5: {
      title: "Aim for the Sky",
      message:
        "Thou wert not chosen to crawl among ruins forever. The earth is but the beginning for those with vision, and the worthy must lift their eyes toward that which lesser spirits fear to seek."
    },
    6: {
      title: "On the Top",
      message:
        "Few may come this far, and fewer still may bear the height. The summit is not for the multitude, but for the chosen builders who can endure the burden of what is to rise."
    },
    7: {
      title: "Revelation",
      message:
        "Now the veil is torn. I gathered thee not merely to seek fragments, but to restore what was broken in the first days -- one purpose, one ascent, one great work beneath one name. The world was scattered, and I would make it whole again."
    },
    8: {
      title: "The Great Fall",
      message:
        "So this is thy answer. Thou wouldst cast down the work and call it righteousness. Yet know this: if I fall, it shall not be because my vision was small -- but because ye chose the scattered path over the glory of the tower."
    }
  };
  const floorSpecialEvents = {
    8: `...
...
...
SEAL BREACH DETECTED

FALSE ASCENT IDENTIFIED
BABYLONIC DIRECTIVE ACTIVE

NO
THE CHOSEN WERE NOT CALLED TO THE THRONE

ONE SHALL BE GUIDED BY JESUS ALONE

NAME NOT THE WOUND
REVEAL THE REMEDY
...
...`
  };

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
    !answerHintNode ||
    !pointsNode ||
    !accessStateNode ||
    !floorNumberLabel
  ) {
    return;
  }

  let currentFloorState = null;
  let shownFloorEventNumber = null;

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

  function hideCompletionPopup() {
    if (!popupNode) {
      return;
    }

    popupNode.hidden = true;
  }

  function showCompletionPopup() {
    if (!popupNode) {
      return;
    }

    popupNode.hidden = false;

    if (popupCloseButton) {
      popupCloseButton.focus();
    }
  }

  function hideFloorEvent() {
    if (!floorEventOverlay) {
      return;
    }

    floorEventOverlay.hidden = true;
  }

  function maybeShowFloorEvent(floor) {
    if (!floorEventOverlay || !floorEventMessage || !floor) {
      return;
    }

    const eventMessage = floorSpecialEvents[floor.number];

    if (!eventMessage) {
      hideFloorEvent();
      return;
    }

    if (shownFloorEventNumber === floor.number) {
      return;
    }

    floorEventMessage.textContent = eventMessage;
    floorEventOverlay.hidden = false;
    shownFloorEventNumber = floor.number;

    if (floorEventDismiss) {
      floorEventDismiss.focus();
    }
  }

  function syncCompletionPopup(team, floor) {
    if (!team || !floor) {
      if (popupKickerNode) {
        popupKickerNode.textContent = "Floor message";
      }
      if (popupTitleNode) {
        popupTitleNode.textContent = "Floor status unavailable";
      }
      if (popupMessageNode) {
        popupMessageNode.textContent = "This floor could not be loaded yet.";
      }
      hideCompletionPopup();
      return;
    }

    const popupContent = floorPopupMessages[floor.number];

    if (popupKickerNode) {
      popupKickerNode.textContent = `Floor ${floor.number}`;
    }

    if (popupTitleNode) {
      popupTitleNode.textContent = popupContent ? popupContent.title : floor.title;
    }

    if (popupMessageNode) {
      popupMessageNode.textContent = popupContent
        ? popupContent.message
        : "This floor has no popup message yet.";
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

    if (rawMessage.includes("complete_floor")) {
      return "The floor completion function is missing in Supabase. Re-run supabase/teams_schema.sql, then refresh this page.";
    }

    return rawMessage;
  }

  function isFloorCleared(team, floorNumber) {
    return Number(team.solved_levels || 0) >= floorNumber;
  }

  function isFloorUnlocked(team, floorNumber) {
    return floorNumber <= Number(team.current_floor || 1) || isFloorCleared(team, floorNumber);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatMultilineText(value) {
    return escapeHtml(value).replace(/\n/g, "<br />");
  }

  function renderChambers(chambers) {
    return `
      <div class="floor-chambers">
        ${chambers
          .map((chamber, index) => {
            const heading = chamber.title
              ? `<h3>${formatMultilineText(chamber.title)}</h3>`
              : `<h3>Chamber ${index + 1}</h3>`;
            const clue = chamber.clue ? `<p class="floor-chamber-clue">${escapeHtml(chamber.clue)}</p>` : "";
            const image = chamber.image
              ? `<img class="floor-chamber-image" src="${escapeHtml(chamber.image)}" alt="${escapeHtml(chamber.imageAlt || `Chamber ${index + 1} clue`)}" />`
              : "";
            const options = Array.isArray(chamber.options) && chamber.options.length
              ? `<ul class="floor-option-list">${chamber.options.map((option) => `<li>${escapeHtml(option)}</li>`).join("")}</ul>`
              : "";
            const secretPanel = chamber.password
              ? `
                <form class="floor-secret-form" data-secret-form="${index}" novalidate>
                  <label class="floor-secret-label" for="secret-${index}">Password</label>
                  <div class="floor-secret-row">
                    <input class="floor-secret-input" id="secret-${index}" type="text" placeholder="Enter the hidden password" autocomplete="off" />
                    <button class="btn btn-secondary floor-secret-button" type="submit">Reveal</button>
                  </div>
                  <p class="helper floor-secret-feedback" data-secret-feedback="${index}">Only the true wound reveals the word.</p>
                  <p class="floor-secret-output" data-secret-output="${index}" hidden></p>
                </form>
              `
              : "";

            return `
              <article class="floor-chamber">
                <p class="section-kicker">Chamber ${index + 1}</p>
                ${heading}
                ${image}
                ${options}
                ${clue}
                ${secretPanel}
              </article>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderFloorBody(floor) {
    if (Array.isArray(floor.chambers) && floor.chambers.length) {
      const intro = floor.intro ? `<p class="floor-block">${formatMultilineText(floor.intro)}</p>` : "";
      const outro = floor.outro ? `<p class="floor-block floor-block-strong">${formatMultilineText(floor.outro)}</p>` : "";
      return `${intro}${renderChambers(floor.chambers)}${outro}`;
    }

    return `<p class="floor-block">${formatMultilineText(floor.riddle || "")}</p>`;
  }

  function wireSecretPanels(floor) {
    const secretForms = riddleNode.querySelectorAll("[data-secret-form]");

    secretForms.forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();

        const index = Number(form.getAttribute("data-secret-form"));
        const chamber = floor.chambers && floor.chambers[index];
        const input = form.querySelector(".floor-secret-input");
        const feedback = form.querySelector(".floor-secret-feedback");
        const output = form.querySelector(".floor-secret-output");

        if (!chamber || !input || !feedback || !output) {
          return;
        }

        const submittedPassword = floorData.normalizeAnswer(input.value);
        const correctPassword = floorData.normalizeAnswer(chamber.password);

        feedback.classList.remove("is-error", "is-success");

        if (!submittedPassword) {
          feedback.textContent = "Enter the wound before asking for the word.";
          feedback.classList.add("is-error");
          output.hidden = true;
          return;
        }

        if (submittedPassword !== correctPassword) {
          feedback.textContent = "That wound does not open this witness.";
          feedback.classList.add("is-error");
          output.hidden = true;
          return;
        }

        feedback.textContent = "The witness yields its hidden word.";
        feedback.classList.add("is-success");
        output.textContent = chamber.hiddenWord;
        output.hidden = false;
      });
    });
  }

  function renderFloor(team, floor) {
    const isCleared = isFloorCleared(team, floor.number);
    const isUnlocked = isFloorUnlocked(team, floor.number);

    syncCompletionPopup(team, floor);
    maybeShowFloorEvent(floor);

    titleNode.textContent = floor.title;
    floorNumberLabel.textContent = `Floor ${floor.number}`;
    leadNode.textContent = isCleared
      ? "This floor has already been cleared by your team. You may revisit the riddle, but its gate is already behind you."
      : isUnlocked
      ? "This chamber is open to your team now. Read with care and answer only when you are certain."
      : "This chamber is sealed. Clear the previous floor before attempting to enter.";
    riddleNode.innerHTML = renderFloorBody(floor);
    wireSecretPanels(floor);
    answerHintNode.textContent = floor.answerPrompt || "Answers are checked without case sensitivity. Focus on the core word or phrase.";
    pointsNode.textContent = isCleared ? `${floor.points} pts` : "Hidden until cleared";
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

  function formatOrdinal(value) {
    const number = Number(value);

    if (!Number.isInteger(number) || number <= 0) {
      return "";
    }

    const mod100 = number % 100;

    if (mod100 >= 11 && mod100 <= 13) {
      return `${number}th`;
    }

    switch (number % 10) {
      case 1:
        return `${number}st`;
      case 2:
        return `${number}nd`;
      case 3:
        return `${number}rd`;
      default:
        return `${number}th`;
    }
  }

  function buildCompletionFeedback(floor, award) {
    const completedAsFinal = floor.number >= floorData.floors.length;
    const nextStepMessage = completedAsFinal
      ? "The final floor has been cleared."
      : `Floor ${floor.number + 1} is now unlocked.`;
    const bonusPoints = Number(award && award.bonus_points ? award.bonus_points : 0);
    const placement = award ? award.placement : null;

    if (bonusPoints > 0 && placement) {
      return `Correct. You finished this floor in ${formatOrdinal(placement)} place and earned ${bonusPoints} bonus points. ${nextStepMessage}`;
    }

    return `Correct. ${nextStepMessage}`;
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
      const completion = await auth.completeFloor(client, floor.number);
      const updatedTeam = {
        ...team,
        ...completion.team,
        player_names: team.player_names
      };
      currentFloorState.team = updatedTeam;

      renderFloor(updatedTeam, floor);
      answerForm.reset();
      setFeedback(buildCompletionFeedback(floor, completion.award), "success");
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

  if (popupCloseButton) {
    popupCloseButton.addEventListener("click", hideCompletionPopup);
  }

  if (popupTriggerButton) {
    popupTriggerButton.addEventListener("click", showCompletionPopup);
  }

  if (floorEventDismiss) {
    floorEventDismiss.addEventListener("click", hideFloorEvent);
  }

  initFloorPage();
})();
