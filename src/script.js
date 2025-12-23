const STORAGE_KEY_REGEX = /^[a-zA-Z0-9_-]+$/;
const FIELD_PREFIX_REGEX = /^[a-zA-Z0-9_-]*$/;
const COOKIE_PATH_INVALID_REGEX = /[;\s]/;
const SELECTOR_VALID_REGEX = /^[a-zA-Z0-9._#[\]="':\s,>+~-]*$/;

(() => {
  const SCRIPT_ELEMENT =
    document.currentScript ??
    [...document.scripts].reverse().find((s) => {
      const src = s.getAttribute("src") || "";
      return (
        src.includes("cdn.jsdelivr.net/npm/form-attribution@") &&
        src.endsWith("/dist/script.min.js")
      );
    }) ??
    null;

  const DEFAULT_PARAMS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "utm_id",
    "ref",
  ];

  const META_PARAMS = [
    "landing_page",
    "current_page",
    "referrer_url",
    "first_touch_timestamp",
  ];

  const CLICK_ID_PARAMS = [
    "gclid",
    "fbclid",
    "msclkid",
    "ttclid",
    "li_fat_id",
    "twclid",
  ];

  const VALID_STORAGE_TYPES = ["sessionStorage", "localStorage", "cookie"];
  const VALID_SAMESITE_VALUES = ["lax", "strict", "none"];
  const MAX_COOKIE_SIZE = 4000;
  const MAX_PARAM_LENGTH = 500;
  const MAX_URL_LENGTH = 2000;

  const safeParse = (data) => {
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const safe = Object.create(null);
      for (const key of Object.keys(parsed)) {
        if (
          key !== "__proto__" &&
          key !== "constructor" &&
          key !== "prototype"
        ) {
          safe[key] = parsed[key];
        }
      }
      return safe;
    }
    return parsed;
  };

  const sanitizeValue = (val) => {
    return String(val).replace(/[<>'"]/g, (char) => {
      const entities = {
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      };
      return entities[char];
    });
  };

  const validateStorageKey = (key) => {
    const safeKey = String(key ?? "form_attribution_data").trim();
    return STORAGE_KEY_REGEX.test(safeKey) ? safeKey : "form_attribution_data";
  };

  const validateFieldPrefix = (prefix) => {
    const safePrefix = String(prefix ?? "").trim();
    return FIELD_PREFIX_REGEX.test(safePrefix) ? safePrefix : "";
  };

  const validateCookiePath = (path) => {
    const safePath = String(path ?? "/").trim();
    return safePath.startsWith("/") && !COOKIE_PATH_INVALID_REGEX.test(safePath)
      ? safePath
      : "/";
  };

  const validateExcludeForms = (selector) => {
    if (!selector) {
      return "";
    }
    const safe = String(selector ?? "").trim();
    if (!SELECTOR_VALID_REGEX.test(safe)) {
      return "";
    }
    return safe;
  };

  const validateCookieDomain = (domain) => {
    if (!domain) {
      return undefined;
    }
    const safeDomain = String(domain).trim().toLowerCase();
    if (!safeDomain) {
      return undefined;
    }
    const currentHost = window.location.hostname.toLowerCase();

    // Must be exact match or a parent domain of current host
    if (safeDomain === currentHost) {
      return safeDomain;
    }
    if (currentHost.endsWith(`.${safeDomain}`)) {
      return safeDomain;
    }

    return undefined;
  };

  const parseExtraParams = (value) => {
    if (!value) {
      return [];
    }
    const safeValue = String(value ?? "").trim();
    return safeValue
      ? safeValue
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean)
      : [];
  };

  const parseStorageType = (value) => {
    const raw = String(value ?? "sessionStorage").trim();
    return VALID_STORAGE_TYPES.includes(raw) ? raw : "sessionStorage";
  };

  const parseCookieExpires = (value) => {
    const raw = Number.parseInt(value ?? "30", 10);
    return Number.isFinite(raw) && raw >= 0 ? raw : 30;
  };

  const parseSameSite = (value) => {
    const raw = String(value ?? "lax")
      .trim()
      .toLowerCase();
    return VALID_SAMESITE_VALUES.includes(raw) ? raw : "lax";
  };

  const getConfig = () => {
    const dataset = SCRIPT_ELEMENT?.dataset ?? {};

    return {
      storage: parseStorageType(dataset.storage),
      cookieDomain: validateCookieDomain(dataset.cookieDomain),
      cookiePath: validateCookiePath(dataset.cookiePath),
      cookieExpires: parseCookieExpires(dataset.cookieExpires),
      cookieSameSite: parseSameSite(dataset.cookieSamesite),
      fieldPrefix: validateFieldPrefix(dataset.fieldPrefix),
      extraParams: parseExtraParams(dataset.extraParams),
      excludeForms: validateExcludeForms(dataset.excludeForms),
      debug: dataset.debug === "true",
      storageKey: validateStorageKey(dataset.storageKey),
      respectPrivacy: dataset.privacy !== "false",
      trackClickIds: dataset.clickIds === "true",
    };
  };

  const CONFIG = getConfig();
  const TRACKED_PARAMS = [
    ...new Set([
      ...DEFAULT_PARAMS,
      ...(CONFIG.trackClickIds ? CLICK_ID_PARAMS : []),
      ...CONFIG.extraParams,
    ]),
  ];
  const PARAMS_TO_INJECT = [...new Set([...TRACKED_PARAMS, ...META_PARAMS])];

  const log = (...args) => {
    if (CONFIG.debug) {
      console.log("[FormAttribution]", ...args);
    }
  };

  const parseUrlParams = (url) => {
    try {
      const urlObj = new URL(url, window.location.origin);
      return Object.fromEntries(urlObj.searchParams.entries());
    } catch {
      return {};
    }
  };

  const isPrivacySignalEnabled = () => {
    if (navigator.globalPrivacyControl === true) {
      return true;
    }

    const dnt = navigator.doNotTrack || window.doNotTrack;
    return dnt === "1" || dnt === "yes";
  };

  const createMemoryAdapter = () => {
    const map = new Map();

    return {
      get(key) {
        return Promise.resolve(map.has(key) ? map.get(key) : null);
      },

      set(key, value) {
        map.set(key, value);
        return Promise.resolve(true);
      },

      remove(key) {
        map.delete(key);
        return Promise.resolve(true);
      },
    };
  };

  const getUsableWebStorage = (type) => {
    try {
      const storage = window[type];
      if (!storage) {
        return null;
      }

      const testKey = "__form_attribution_test__";
      storage.setItem(testKey, testKey);
      storage.removeItem(testKey);
      return storage;
    } catch {
      return null;
    }
  };

  const getStorageCandidates = (requested) => {
    if (requested === "localStorage") {
      return ["localStorage", "sessionStorage", "cookie", "memory"];
    }
    if (requested === "sessionStorage") {
      return ["sessionStorage", "cookie", "memory"];
    }
    if (requested === "cookie") {
      return ["cookie", "memory"];
    }
    return ["sessionStorage", "cookie", "memory"];
  };

  const tryCreateAdapter = (candidate) => {
    if (candidate === "cookie") {
      log("Using cookie storage");
      return createCookieAdapter();
    }
    if (candidate === "memory") {
      log("Using in-memory storage");
      return createMemoryAdapter();
    }
    const storage = getUsableWebStorage(candidate);
    if (storage) {
      log(`Using ${candidate} storage`);
      return createWebStorageAdapter(storage);
    }
    return null;
  };

  const createStorageAdapter = (type) => {
    const requested = String(type ?? "").trim();
    const candidates = getStorageCandidates(requested);

    for (const candidate of candidates) {
      const adapter = tryCreateAdapter(candidate);
      if (adapter) {
        return adapter;
      }
    }

    log("Falling back to in-memory storage");
    return createMemoryAdapter();
  };

  const createWebStorageAdapter = (storage) => ({
    get(key) {
      try {
        const data = storage.getItem(key);
        return Promise.resolve(data ? safeParse(data) : null);
      } catch (e) {
        log("Storage get error:", e);
        return Promise.resolve(null);
      }
    },

    set(key, value) {
      try {
        storage.setItem(key, JSON.stringify(value));
        return Promise.resolve(true);
      } catch (e) {
        log("Storage set error:", e);
        return Promise.resolve(false);
      }
    },

    remove(key) {
      try {
        storage.removeItem(key);
        return Promise.resolve(true);
      } catch (e) {
        log("Storage remove error:", e);
        return Promise.resolve(false);
      }
    },
  });

  const createCookieAdapter = () => {
    const fallback = createMemoryAdapter();
    let primaryWriteFailed = false;
    let cookieStoreApi = null;

    try {
      cookieStoreApi = window.cookieStore ?? null;
    } catch {
      cookieStoreApi = null;
    }

    const useCookieStore = Boolean(
      cookieStoreApi &&
        typeof cookieStoreApi.get === "function" &&
        typeof cookieStoreApi.set === "function" &&
        typeof cookieStoreApi.delete === "function"
    );

    let forceLegacy = !useCookieStore;

    const getExpirationDate = () => {
      const date = new Date();
      date.setDate(date.getDate() + CONFIG.cookieExpires);
      return date;
    };

    const shouldUseSecure =
      CONFIG.cookieSameSite === "none" || window.location.protocol === "https:";

    const getSameSiteForCookieString = () => {
      switch (CONFIG.cookieSameSite) {
        case "strict":
          return "Strict";
        case "none":
          return "None";
        default:
          return "Lax";
      }
    };

    const legacyCookieAdapter = {
      async get(key) {
        try {
          if (primaryWriteFailed) {
            return await fallback.get(key);
          }

          const cookies = document.cookie.split(";");
          for (const cookie of cookies) {
            const [name, ...valueParts] = cookie.trim().split("=");
            if (name === key) {
              const value = valueParts.join("=");
              return safeParse(decodeURIComponent(value));
            }
          }

          return await fallback.get(key);
        } catch (e) {
          log("Legacy cookie get error:", e);
          return await fallback.get(key);
        }
      },

      async set(key, value) {
        try {
          const encodedValue = encodeURIComponent(JSON.stringify(value));
          const expires = getExpirationDate().toUTCString();

          let cookieStr = `${key}=${encodedValue}; path=${CONFIG.cookiePath}; expires=${expires}; SameSite=${getSameSiteForCookieString()}`;

          if (CONFIG.cookieDomain) {
            cookieStr += `; domain=${CONFIG.cookieDomain}`;
          }

          if (shouldUseSecure) {
            cookieStr += "; Secure";
          }

          if (cookieStr.length > MAX_COOKIE_SIZE) {
            log(
              `Cookie size (${cookieStr.length}) exceeds limit (${MAX_COOKIE_SIZE}), falling back to memory storage`
            );
            primaryWriteFailed = true;
            await fallback.set(key, value);
            return true;
          }

          // biome-ignore lint/suspicious/noDocumentCookie: Needed for legacy cookie fallback when CookieStore API isn't available.
          document.cookie = cookieStr;
          await fallback.set(key, value);
          return true;
        } catch (e) {
          log("Legacy cookie set error:", e);
          primaryWriteFailed = true;
          await fallback.set(key, value);
          return true;
        }
      },

      async remove(key) {
        try {
          let cookieStr = `${key}=; path=${CONFIG.cookiePath}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=${getSameSiteForCookieString()}`;
          if (CONFIG.cookieDomain) {
            cookieStr += `; domain=${CONFIG.cookieDomain}`;
          }

          if (shouldUseSecure) {
            cookieStr += "; Secure";
          }

          // biome-ignore lint/suspicious/noDocumentCookie: Needed for legacy cookie fallback when CookieStore API isn't available.
          document.cookie = cookieStr;
          await fallback.remove(key);
          return true;
        } catch (e) {
          log("Legacy cookie remove error:", e);
          await fallback.remove(key);
          return true;
        }
      },
    };

    const cookieStoreAdapter = {
      async get(key) {
        try {
          if (primaryWriteFailed) {
            return fallback.get(key);
          }

          if (forceLegacy) {
            return legacyCookieAdapter.get(key);
          }

          const cookie = await cookieStoreApi.get(key);
          if (cookie?.value) {
            return safeParse(decodeURIComponent(cookie.value));
          }
          return fallback.get(key);
        } catch (e) {
          log("CookieStore get error:", e);
          forceLegacy = true;
          return legacyCookieAdapter.get(key);
        }
      },

      async set(key, value) {
        try {
          if (forceLegacy) {
            return legacyCookieAdapter.set(key, value);
          }

          const encodedValue = encodeURIComponent(JSON.stringify(value));

          if (encodedValue.length > MAX_COOKIE_SIZE) {
            log(
              `Cookie value size (${encodedValue.length}) exceeds limit (${MAX_COOKIE_SIZE}), falling back to memory storage`
            );
            primaryWriteFailed = true;
            await fallback.set(key, value);
            return true;
          }

          const cookieOptions = {
            name: key,
            value: encodedValue,
            path: CONFIG.cookiePath,
            expires: getExpirationDate(),
            sameSite: CONFIG.cookieSameSite,
            secure: shouldUseSecure,
          };

          if (CONFIG.cookieDomain) {
            cookieOptions.domain = CONFIG.cookieDomain;
          }

          await cookieStoreApi.set(cookieOptions);
          await fallback.set(key, value);
          return true;
        } catch (e) {
          log("CookieStore set error:", e);
          forceLegacy = true;
          return legacyCookieAdapter.set(key, value);
        }
      },

      async remove(key) {
        try {
          if (forceLegacy) {
            return legacyCookieAdapter.remove(key);
          }

          const deleteOptions = { name: key, path: CONFIG.cookiePath };

          if (CONFIG.cookieDomain) {
            deleteOptions.domain = CONFIG.cookieDomain;
          }

          await cookieStoreApi.delete(deleteOptions);
          await fallback.remove(key);
          return true;
        } catch (e) {
          log("CookieStore remove error:", e);
          forceLegacy = true;
          return legacyCookieAdapter.remove(key);
        }
      },
    };

    log(
      `Using ${useCookieStore ? "CookieStore API" : "legacy document.cookie"}`
    );
    return useCookieStore ? cookieStoreAdapter : legacyCookieAdapter;
  };

  const captureAttributionData = () => {
    const currentUrl = window.location.href;
    const urlParams = parseUrlParams(currentUrl);
    const trackedParams = TRACKED_PARAMS;

    const attributionData = {};

    for (const param of trackedParams) {
      if (urlParams[param] !== undefined) {
        attributionData[param] = String(urlParams[param]).substring(
          0,
          MAX_PARAM_LENGTH
        );
      }
    }

    attributionData.landing_page = currentUrl
      .split("?")[0]
      .substring(0, MAX_URL_LENGTH);
    attributionData.referrer_url = (document.referrer || "").substring(
      0,
      MAX_URL_LENGTH
    );
    attributionData.first_touch_timestamp = new Date().toISOString();

    return attributionData;
  };

  const mergeAttributionData = (existing, current) => {
    if (!existing) {
      return current;
    }

    const merged = { ...existing };
    const trackedParams = TRACKED_PARAMS;

    for (const param of trackedParams) {
      if (current[param] !== undefined && existing[param] === undefined) {
        merged[param] = current[param];
      }
    }

    if (!merged.landing_page) {
      merged.landing_page = current.landing_page;
    }

    if (!merged.referrer_url && current.referrer_url) {
      merged.referrer_url = current.referrer_url;
    }

    if (!merged.first_touch_timestamp) {
      merged.first_touch_timestamp = current.first_touch_timestamp;
    }

    return merged;
  };

  const shouldIncludeForm = (form) => {
    if (!CONFIG.excludeForms) {
      return true;
    }

    try {
      return !form.matches(CONFIG.excludeForms);
    } catch {
      return true;
    }
  };

  const getAttributionEntries = (data) => {
    const entries = [];

    if (!data || typeof data !== "object") {
      return entries;
    }

    for (const param of PARAMS_TO_INJECT) {
      if (param === "current_page") {
        continue;
      }
      const value = data[param];
      if (value !== undefined && value !== null && value !== "") {
        entries.push({
          name: `${CONFIG.fieldPrefix}${param}`,
          value: String(value),
        });
      }
    }

    entries.push({
      name: `${CONFIG.fieldPrefix}current_page`,
      value: window.location.href.split("?")[0],
    });

    return entries;
  };

  const getTargetForms = () =>
    Array.from(document.querySelectorAll("form")).filter(shouldIncludeForm);

  const removeExistingFields = (form) => {
    const existingFields = form.querySelectorAll(
      'input[data-form-attribution="true"]'
    );

    for (const field of existingFields) {
      field.remove();
    }
  };

  const clearManagedFieldValues = (form) => {
    const managedFields = form.querySelectorAll(
      'input[type="hidden"][data-form-attribution-managed="true"]'
    );
    for (const field of managedFields) {
      field.value = "";
    }
  };

  const getFormElements = (form) => {
    try {
      return Object.getOwnPropertyDescriptor(
        HTMLFormElement.prototype,
        "elements"
      ).get.call(form);
    } catch {
      return form.elements;
    }
  };

  const getHiddenInputsByName = (form, name) => {
    const matches = [];
    const elements = getFormElements(form);
    if (!elements) {
      return matches;
    }

    for (const el of elements) {
      if (!el || el.tagName !== "INPUT") {
        continue;
      }

      const input = el;
      if (input.type === "hidden" && input.name === name) {
        matches.push(input);
      }
    }

    return matches;
  };

  const syncFormAttributionFields = (form, entries) => {
    removeExistingFields(form);

    if (!entries || entries.length === 0) {
      clearManagedFieldValues(form);
      return;
    }

    const fragment = document.createDocumentFragment();

    for (const entry of entries) {
      const existingInputs = getHiddenInputsByName(form, entry.name);
      const safeValue = sanitizeValue(entry.value);

      if (existingInputs.length > 0) {
        for (const input of existingInputs) {
          input.value = safeValue;
          input.dataset.formAttributionManaged = "true";
        }

        continue;
      }

      const input = document.createElement("input");
      input.type = "hidden";
      input.name = entry.name;
      input.value = safeValue;

      input.dataset.formAttribution = "true";
      input.dataset.formAttributionManaged = "true";
      fragment.appendChild(input);
    }

    if (fragment.hasChildNodes()) {
      form.appendChild(fragment);
    }
  };

  const injectIntoForms = (data) => {
    const forms = getTargetForms();

    if (forms.length === 0) {
      log("No forms found on page");
      return;
    }

    const entries = getAttributionEntries(data);

    for (const form of forms) {
      syncFormAttributionFields(form, entries);

      log(
        "Synced attribution fields in form:",
        form.id || form.name || "[unnamed]"
      );
    }

    log(
      entries.length === 0
        ? `Cleared attribution fields in ${forms.length} form(s)`
        : `Injected attribution data into ${forms.length} form(s)`
    );
  };

  const setupFormObserver = (getData) => {
    const pendingForms = new Set();
    let scheduled = false;

    const flush = () => {
      scheduled = false;
      if (pendingForms.size === 0) {
        return;
      }

      const entries = getAttributionEntries(getData());
      for (const form of pendingForms) {
        if (document.contains(form)) {
          syncFormAttributionFields(form, entries);
        }
      }
      pendingForms.clear();
    };

    const scheduleFlush = () => {
      if (scheduled) {
        return;
      }
      scheduled = true;

      if (typeof queueMicrotask === "function") {
        queueMicrotask(flush);
      } else {
        Promise.resolve().then(flush);
      }
    };

    const addFormIfIncluded = (form) => {
      if (shouldIncludeForm(form)) {
        pendingForms.add(form);
      }
    };

    const collectFormsFromNode = (node) => {
      if (node.tagName === "FORM") {
        addFormIfIncluded(node);
      }

      if (node.querySelectorAll) {
        const nestedForms = node.querySelectorAll("form");
        for (const form of nestedForms) {
          addFormIfIncluded(form);
        }
      }
    };

    const processAddedNodes = (addedNodes) => {
      for (const node of addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) {
          continue;
        }
        collectFormsFromNode(node);
      }
    };

    const handleMutations = (mutations) => {
      for (const mutation of mutations) {
        processAddedNodes(mutation.addedNodes);
      }

      if (pendingForms.size > 0) {
        scheduleFlush();
      }
    };

    const observer = new MutationObserver(handleMutations);

    if (!document.body) {
      log("Form observer could not initialize: document.body not found");
      return observer;
    }

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    log("Form observer initialized");
    return observer;
  };

  const init = async () => {
    log("Initializing with config:", CONFIG);

    const storage = createStorageAdapter(CONFIG.storage);
    let latestData = null;

    const existingData = await storage.get(CONFIG.storageKey);
    log("Existing attribution data:", existingData);

    const currentData = captureAttributionData();
    log("Current attribution data:", currentData);

    const mergedData = mergeAttributionData(existingData, currentData);
    latestData = mergedData;
    log("Merged attribution data:", mergedData);

    if (Object.keys(mergedData).length > 0) {
      await storage.set(CONFIG.storageKey, mergedData);
      log("Attribution data saved");
    }

    injectIntoForms(latestData);

    setupFormObserver(() => latestData);

    log("Initialization complete");
  };

  const run = async () => {
    if (CONFIG.respectPrivacy && isPrivacySignalEnabled()) {
      log("Tracking disabled due to privacy signal (GPC/DNT)");
      return;
    }

    if (document.readyState === "loading") {
      document.addEventListener(
        "DOMContentLoaded",
        () => {
          init().catch((e) => log("Initialization error:", e));
        },
        { once: true }
      );
    } else {
      await init().catch((e) => log("Initialization error:", e));
    }
  };

  run();
})();
