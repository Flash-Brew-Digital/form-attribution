const SCRIPT_SRC =
  "https://cdn.jsdelivr.net/npm/form-attribution@latest/dist/script.min.js";

const state = {
  storage: "sessionStorage",
  cookieDomain: "",
  cookiePath: "/",
  cookieExpires: 30,
  cookieSameSite: "lax",
  fieldPrefix: "",
  storageKey: "",
  debug: false,
  respectPrivacy: true,
  trackClickIds: false,
};

const elements = {
  // Inputs
  storageType: document.getElementById("storage-type"),
  cookieDomain: document.getElementById("cookie-domain"),
  cookiePath: document.getElementById("cookie-path"),
  cookieExpires: document.getElementById("cookie-expires"),
  cookieSameSite: document.getElementById("cookie-samesite"),
  fieldPrefix: document.getElementById("field-prefix"),
  storageKey: document.getElementById("storage-key"),
  debugMode: document.getElementById("debug-mode"),
  respectPrivacy: document.getElementById("respect-privacy"),
  trackClickIds: document.getElementById("track-click-ids"),

  // Pill Inputs
  extraParamsContainer: document.getElementById("extra-params-container"),
  extraParamsInput: document.getElementById("extra-params-input"),
  excludeFormsContainer: document.getElementById("exclude-forms-container"),
  excludeFormsInput: document.getElementById("exclude-forms-input"),

  // UI Elements
  cookieOptions: document.getElementById("cookie-options"),
  codeBlock: document.getElementById("code-block"),
  codeOutput: document.getElementById("code-output"),
  codeExpandBtn: document.getElementById("code-expand-btn"),
  copyBtn: document.getElementById("copy-btn"),
  copyStatus: document.getElementById("copy-status"),

  // Templates
  pillTemplate: document.getElementById("pill-template"),
};

const pillData = {
  extraParams: [],
  excludeForms: [],
};

const escapeAttributeValue = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\r/g, "&#13;")
    .replace(/\n/g, "&#10;");

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex by nature - builds dynamic script tag
const generateScriptTag = () => {
  const attributes = [];
  const scriptCloseTag = ["<", "/script>"].join("");
  const isMultiline = elements.codeBlock?.dataset.expanded === "true";

  attributes.push(`src="${escapeAttributeValue(SCRIPT_SRC)}"`);

  if (state.storage !== "sessionStorage") {
    attributes.push(`data-storage="${escapeAttributeValue(state.storage)}"`);
  }

  if (state.storage === "cookie") {
    if (state.cookieDomain.trim()) {
      attributes.push(
        `data-cookie-domain="${escapeAttributeValue(state.cookieDomain.trim())}"`
      );
    }
    if (state.cookiePath !== "/") {
      attributes.push(
        `data-cookie-path="${escapeAttributeValue(state.cookiePath)}"`
      );
    }
    if (state.cookieExpires !== 30) {
      attributes.push(
        `data-cookie-expires="${escapeAttributeValue(state.cookieExpires)}"`
      );
    }
    if (state.cookieSameSite !== "lax") {
      attributes.push(
        `data-cookie-samesite="${escapeAttributeValue(state.cookieSameSite)}"`
      );
    }
  }

  if (state.fieldPrefix.trim()) {
    attributes.push(
      `data-field-prefix="${escapeAttributeValue(state.fieldPrefix.trim())}"`
    );
  }

  if (pillData.extraParams.length > 0) {
    attributes.push(
      `data-extra-params="${escapeAttributeValue(pillData.extraParams.join(","))}"`
    );
  }

  if (pillData.excludeForms.length > 0) {
    attributes.push(
      `data-exclude-forms="${escapeAttributeValue(pillData.excludeForms.join(","))}"`
    );
  }

  if (state.storageKey.trim()) {
    attributes.push(
      `data-storage-key="${escapeAttributeValue(state.storageKey.trim())}"`
    );
  }

  if (state.debug) {
    attributes.push('data-debug="true"');
  }

  if (!state.respectPrivacy) {
    attributes.push('data-privacy="false"');
  }

  if (state.trackClickIds) {
    attributes.push('data-click-ids="true"');
  }

  if (isMultiline) {
    return `<script\n  ${attributes.join("\n  ")}\n>${scriptCloseTag}`;
  }

  return `<script ${attributes.join(" ")}>${scriptCloseTag}`;
};

const highlightCodeOutput = () => {
  const codeElement = elements.codeOutput;
  if (!codeElement) {
    return;
  }

  codeElement.removeAttribute("data-highlighted");

  if (window.hljs && typeof window.hljs.highlightElement === "function") {
    window.hljs.highlightElement(codeElement);
  }
};

const updateCodeOutput = () => {
  const code = generateScriptTag();
  elements.codeOutput.textContent = code;
  highlightCodeOutput();
};

let copyFeedbackTimeoutId = null;

const showCopyFeedback = (ok) => {
  if (elements.copyStatus) {
    elements.copyStatus.textContent = ok
      ? "Copied to clipboard"
      : "Copy to clipboard failed";

    if (copyFeedbackTimeoutId) {
      clearTimeout(copyFeedbackTimeoutId);
    }

    copyFeedbackTimeoutId = setTimeout(() => {
      elements.copyStatus.textContent = "";
      copyFeedbackTimeoutId = null;
    }, 2000);
  }

  if (!ok) {
    return;
  }

  if (window.gsap && elements.copyBtn) {
    const btn = elements.copyBtn;
    const iconCopy = btn.querySelector("#icon-copy");
    const iconCheck = btn.querySelector("#icon-check");

    if (!(iconCopy && iconCheck)) {
      return;
    }

    const originalBtnBg = getComputedStyle(btn).backgroundColor;
    const originalBtnBorder = getComputedStyle(btn).borderColor;
    const originalBtnColor = getComputedStyle(btn).color;

    // biome-ignore lint/correctness/noUndeclaredVariables: gsap is loaded from CDN
    gsap.killTweensOf([btn, iconCopy, iconCheck]);

    // biome-ignore lint/correctness/noUndeclaredVariables: gsap is loaded from CDN
    const tl = gsap.timeline();

    tl.to(btn, {
      backgroundColor: "hsl(142, 76%, 36%)",
      borderColor: "hsl(142, 76%, 36%)",
      color: "hsl(0, 0%, 98%)",
      duration: 0.2,
      ease: "power2.out",
    })
      .to(
        iconCopy,
        {
          opacity: 0,
          scale: 0.5,
          duration: 0.2,
          ease: "power2.in",
        },
        "<"
      )
      .to(
        iconCheck,
        {
          opacity: 1,
          scale: 1,
          duration: 0.3,
          ease: "back.out(1.7)",
        },
        "-=0.1"
      );

    tl.addLabel("revert", "+=2");

    tl.to(
      iconCheck,
      {
        opacity: 0,
        scale: 0.5,
        duration: 0.25,
        ease: "power2.in",
      },
      "revert"
    )
      .to(
        btn,
        {
          backgroundColor: originalBtnBg,
          borderColor: originalBtnBorder,
          color: originalBtnColor,
          duration: 0.4,
          ease: "power2.inOut",
          onComplete: () => {
            // biome-ignore lint/correctness/noUndeclaredVariables: gsap is loaded from CDN
            gsap.set(btn, { clearProps: "all" });
          },
        },
        "revert+=0.1"
      )
      .to(
        iconCopy,
        {
          opacity: 1,
          scale: 1,
          duration: 0.35,
          ease: "back.out(1.5)",
        },
        "revert+=0.2"
      );
  }
};

const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Continue to fallback
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
};

const initTabs = () => {
  const triggers = document.querySelectorAll(".tab-trigger");
  const contents = document.querySelectorAll(".tab-content");

  for (const trigger of triggers) {
    trigger.addEventListener("click", () => {
      const tabId = trigger.dataset.tab;

      for (const t of triggers) {
        t.setAttribute("aria-selected", t === trigger ? "true" : "false");
      }

      for (const content of contents) {
        const isActive = content.id === `tab-${tabId}`;
        content.dataset.state = isActive ? "active" : "";
      }
    });
  }
};

const initAccordions = () => {
  const triggers = document.querySelectorAll(".accordion-trigger");

  for (const trigger of triggers) {
    trigger.addEventListener("click", () => {
      const expanded = trigger.getAttribute("aria-expanded") === "true";
      const contentId = trigger.getAttribute("aria-controls");
      const content = document.getElementById(contentId);

      trigger.setAttribute("aria-expanded", !expanded);
      content.dataset.state = expanded ? "" : "open";
    });
  }
};

const toggleCookieOptions = () => {
  const showCookie = state.storage === "cookie";
  elements.cookieOptions.style.display = showCookie ? "block" : "none";
};

const createPillElement = (value, stateKey) => {
  const pill = elements.pillTemplate.content.firstElementChild.cloneNode(true);
  pill.dataset.value = value;
  pill.querySelector(".pill-text").textContent = value;

  const removeBtn = pill.querySelector(".pill-remove");
  removeBtn.setAttribute("aria-label", `Remove ${value}`);
  removeBtn.addEventListener("click", () => {
    removePill(stateKey, value);
  });

  return pill;
};

const addPill = (stateKey, value) => {
  const trimmed = value.trim();
  if (!trimmed || pillData[stateKey].includes(trimmed)) {
    return false;
  }

  pillData[stateKey].push(trimmed);

  const container =
    stateKey === "extraParams"
      ? elements.extraParamsContainer
      : elements.excludeFormsContainer;
  const input =
    stateKey === "extraParams"
      ? elements.extraParamsInput
      : elements.excludeFormsInput;

  const pill = createPillElement(trimmed, stateKey);
  container.insertBefore(pill, input);

  updateCodeOutput();
  return true;
};

const removePill = (stateKey, value) => {
  const index = pillData[stateKey].indexOf(value);
  if (index === -1) {
    return;
  }

  pillData[stateKey].splice(index, 1);

  const container =
    stateKey === "extraParams"
      ? elements.extraParamsContainer
      : elements.excludeFormsContainer;

  const pill = container.querySelector(
    `.pill[data-value="${CSS.escape(value)}"]`
  );
  if (pill) {
    pill.remove();
  }

  updateCodeOutput();
};

const initPillInput = (container, input, stateKey) => {
  if (!(container && input)) {
    return;
  }

  container.addEventListener("click", (e) => {
    if (e.target === container) {
      input.focus();
    }
  });

  input.addEventListener("keydown", (e) => {
    const value = input.value;

    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (value.trim()) {
        addPill(stateKey, value);
        input.value = "";
      }
    } else if (
      e.key === "Backspace" &&
      !value &&
      pillData[stateKey].length > 0
    ) {
      const lastValue = pillData[stateKey][pillData[stateKey].length - 1];
      removePill(stateKey, lastValue);
    }
  });

  input.addEventListener("paste", (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData?.getData("text") || "";
    const values = pastedText
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    for (const v of values) {
      addPill(stateKey, v);
    }
  });

  input.addEventListener("blur", () => {
    const value = input.value.trim();
    if (value) {
      addPill(stateKey, value);
      input.value = "";
    }
  });
};

const bindInputListeners = () => {
  const textInputs = [
    ["cookieDomain", "cookieDomain"],
    ["cookiePath", "cookiePath"],
    ["fieldPrefix", "fieldPrefix"],
    ["storageKey", "storageKey"],
  ];

  for (const [elementKey, stateKey] of textInputs) {
    elements[elementKey]?.addEventListener("input", (e) => {
      state[stateKey] = e.target.value;
      updateCodeOutput();
    });
  }

  initPillInput(
    elements.extraParamsContainer,
    elements.extraParamsInput,
    "extraParams"
  );
  initPillInput(
    elements.excludeFormsContainer,
    elements.excludeFormsInput,
    "excludeForms"
  );

  elements.cookieExpires?.addEventListener("input", (e) => {
    const raw = Number.parseInt(e.target.value, 10);
    if (Number.isFinite(raw)) {
      state.cookieExpires = Math.min(Math.max(raw, 1), 365);
    } else {
      state.cookieExpires = 30;
    }
    updateCodeOutput();
  });

  elements.storageType?.addEventListener("change", (e) => {
    state.storage = e.target.value;
    toggleCookieOptions();
    updateCodeOutput();
  });

  elements.cookieSameSite?.addEventListener("change", (e) => {
    state.cookieSameSite = e.target.value;
    updateCodeOutput();
  });

  elements.debugMode?.addEventListener("change", (e) => {
    state.debug = e.target.checked;
    updateCodeOutput();
  });

  elements.respectPrivacy?.addEventListener("change", (e) => {
    state.respectPrivacy = e.target.checked;
    updateCodeOutput();
  });

  elements.trackClickIds?.addEventListener("change", (e) => {
    state.trackClickIds = e.target.checked;
    updateCodeOutput();
  });
};

const bindCopyListeners = () => {
  const copyHandler = async () => {
    const code = generateScriptTag();
    const ok = await copyToClipboard(code);
    showCopyFeedback(ok);
  };

  elements.copyBtn?.addEventListener("click", () => {
    copyHandler().catch(() => {
      // Errors handled in copyHandler
    });
  });
};

const initCodeExpandToggle = () => {
  if (!(elements.codeBlock && elements.codeExpandBtn)) {
    return;
  }

  const setExpanded = (expanded) => {
    elements.codeBlock.dataset.expanded = expanded ? "true" : "false";
    elements.codeExpandBtn.setAttribute(
      "aria-expanded",
      expanded ? "true" : "false"
    );
  };

  setExpanded(elements.codeBlock.dataset.expanded === "true");

  elements.codeExpandBtn.addEventListener("click", () => {
    const isExpanded = elements.codeBlock.dataset.expanded === "true";
    setExpanded(!isExpanded);
    updateCodeOutput();
  });
};

const initThemeHighlightListener = () => {
  const themeToggle = document.getElementById("theme-toggle");
  themeToggle?.addEventListener("change", () => {
    highlightCodeOutput();
  });
};

const initOpenInChatDropdowns = () => {
  const DEFAULT_QUERY =
    "Help me implement the Form Attribution library (https://form-attribution.flashbrew.digital) on my website. It's a lightweight script that captures marketing attribution data (referrer, UTM parameters, ad click IDs, and more) and injects it into forms as hidden fields. Docs: https://form-attribution.flashbrew.digital/docs.";

  const providers = {
    chatgpt: (prompt) =>
      `https://chatgpt.com/?${new URLSearchParams({ hints: "search", prompt })}`,
    claude: (q) => `https://claude.ai/new?${new URLSearchParams({ q })}`,
    scira: (q) => `https://scira.ai/?${new URLSearchParams({ q })}`,
    t3: (q) => `https://t3.chat/new?${new URLSearchParams({ q })}`,
    v0: (q) => `https://v0.app?${new URLSearchParams({ q })}`,
    cursor: (text) => {
      const url = new URL("https://cursor.com/link/prompt");
      url.searchParams.set("text", text);
      return url.toString();
    },
  };

  const dropdowns = document.querySelectorAll(".open-in-chat");

  for (const dropdown of dropdowns) {
    const trigger = dropdown.querySelector(".open-in-chat-trigger");
    const content = dropdown.querySelector(".open-in-chat-content");

    if (!(trigger && content)) {
      continue;
    }

    // Set up provider URLs
    const query = dropdown.dataset.query || DEFAULT_QUERY;
    for (const item of dropdown.querySelectorAll("[data-provider]")) {
      const provider = item.dataset.provider;
      if (providers[provider]) {
        item.href = providers[provider](query);
      }
    }

    // Toggle dropdown
    const toggle = (open) => {
      const isOpen =
        open !== undefined ? open : dropdown.dataset.state !== "open";
      dropdown.dataset.state = isOpen ? "open" : "closed";
      trigger.setAttribute("aria-expanded", isOpen);
    };

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      toggle();
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target)) {
        toggle(false);
      }
    });

    // Close on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && dropdown.dataset.state === "open") {
        toggle(false);
        trigger.focus();
      }
    });
  }
};

const init = () => {
  initThemeHighlightListener();
  initTabs();
  initAccordions();
  initCodeExpandToggle();
  initOpenInChatDropdowns();

  bindInputListeners();
  bindCopyListeners();

  updateCodeOutput();

  console.log("[Script Builder] Initialized");
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
