(function () {
  let cachedClient = null;

  function getConfig() {
    return window.SUPABASE_CONFIG || {};
  }

  function hasLiveConfig() {
    const config = getConfig();

    return (
      typeof config.url === "string" &&
      typeof config.anonKey === "string" &&
      config.url.length > 0 &&
      config.anonKey.length > 0 &&
      !config.url.includes("YOUR-PROJECT") &&
      !config.anonKey.includes("YOUR-ANON-KEY")
    );
  }

  function getClient() {
    if (cachedClient) {
      return cachedClient;
    }

    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      return null;
    }

    if (!hasLiveConfig()) {
      return null;
    }

    const config = getConfig();

    cachedClient = window.supabase.createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });

    return cachedClient;
  }

  window.BabilonSupabase = {
    getClient,
    getConfig,
    hasLiveConfig
  };
})();
