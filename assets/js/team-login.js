(function () {
  const loginForm = document.getElementById("loginForm");
  const loginFeedback = document.getElementById("loginFeedback");
  const loginSubmit = document.getElementById("loginSubmit");

  if (!loginForm || !loginFeedback || !loginSubmit) {
    return;
  }

  const auth = window.BabilonAuth;
  const client = auth ? auth.getClient() : null;

  function setFeedback(message, type) {
    loginFeedback.textContent = message;
    loginFeedback.classList.remove("is-error", "is-success");

    if (type) {
      loginFeedback.classList.add(type === "error" ? "is-error" : "is-success");
    }
  }

  async function redirectIfAlreadyLoggedIn() {
    if (!client) {
      return;
    }

    const {
      data: { session }
    } = await client.auth.getSession();

    if (session) {
      window.location.href = auth.getNextTarget();
    }
  }

  redirectIfAlreadyLoggedIn();

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!client) {
      setFeedback("Supabase is not configured yet. Add your project URL and anon key first.", "error");
      return;
    }

    const formData = new FormData(loginForm);
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      setFeedback("Enter the shared team email and password.", "error");
      return;
    }

    loginSubmit.disabled = true;
    loginSubmit.textContent = "Signing in...";
    setFeedback("Checking team access...", "success");

    try {
      const { error } = await client.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      setFeedback("Signed in successfully. Redirecting now...", "success");
      window.location.href = auth.getNextTarget();
    } catch (error) {
      setFeedback(error && error.message ? error.message : "Could not sign in with that team account.", "error");
    } finally {
      loginSubmit.disabled = false;
      loginSubmit.textContent = "Sign in";
    }
  });
})();
