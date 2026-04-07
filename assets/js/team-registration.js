(function () {
  const entryForm = document.getElementById("entryForm");
  const entryFeedback = document.getElementById("entryFeedback");
  const entrySubmit = document.getElementById("entrySubmit");

  if (!entryForm || !entryFeedback || !entrySubmit) {
    return;
  }

  const config = window.SUPABASE_CONFIG || {};
  const supabaseFactory = window.supabase && window.supabase.createClient;
  const hasLiveConfig =
    typeof config.url === "string" &&
    typeof config.anonKey === "string" &&
    config.url.length > 0 &&
    config.anonKey.length > 0 &&
    !config.url.includes("YOUR-PROJECT") &&
    !config.anonKey.includes("YOUR-ANON-KEY");

  let supabaseClient = null;

  if (supabaseFactory && hasLiveConfig) {
    supabaseClient = supabaseFactory(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  }

  const setFeedback = (message, type) => {
    entryFeedback.textContent = message;
    entryFeedback.classList.remove("is-error", "is-success");

    if (type) {
      entryFeedback.classList.add(type === "error" ? "is-error" : "is-success");
    }
  };

  const parsePlayerNames = (value) => {
    return value
      .split(/\r?\n|,/)
      .map((name) => name.trim())
      .filter(Boolean);
  };

  entryForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(entryForm);
    const groupName = String(formData.get("groupName") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");
    const playerNames = parsePlayerNames(String(formData.get("playerNames") || ""));

    if (!groupName) {
      setFeedback("Enter a group name before creating the team account.", "error");
      return;
    }

    if (!email) {
      setFeedback("Enter the shared team email.", "error");
      return;
    }

    if (playerNames.length === 0) {
      setFeedback("Add at least one player name for the group.", "error");
      return;
    }

    if (password.length < 8) {
      setFeedback("Use a password with at least 8 characters.", "error");
      return;
    }

    if (password !== confirmPassword) {
      setFeedback("The password confirmation does not match.", "error");
      return;
    }

    if (!supabaseClient) {
      setFeedback("Supabase is not configured yet. Add your project URL and anon key in assets/js/supabase-config.js, then try again.", "error");
      return;
    }

    entrySubmit.disabled = true;
    entrySubmit.textContent = "Creating team account...";
    setFeedback("Creating the shared team account now...", "success");

    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: config.emailRedirectTo || window.location.href,
          data: {
            group_name: groupName,
            player_names: playerNames,
            registration_type: "team"
          }
        }
      });

      if (error) {
        throw error;
      }

      entryForm.reset();

      if (data.session) {
        setFeedback("Team account created successfully. Your group can now sign in with the shared email and password.", "success");
      } else {
        setFeedback("Team account created. Check the shared team email to confirm the account before signing in.", "success");
      }
    } catch (error) {
      const message = error && error.message ? error.message : "Something went wrong while creating the team account.";
      setFeedback(message, "error");
    } finally {
      entrySubmit.disabled = false;
      entrySubmit.textContent = "Create team account";
    }
  });
})();
