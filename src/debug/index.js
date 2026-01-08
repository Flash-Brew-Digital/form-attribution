/**
 * Form Attribution - Debug Overlay
 * Loaded dynamically when data-debug="true" is set
 *
 * Build: node scripts/build.js
 * The __STYLES__ and __TEMPLATE__ placeholders are replaced at build time.
 */

(() => {
  const FA = window.FormAttribution;

  if (!FA) {
    console.warn("[FormAttribution Debug] FormAttribution API not found");
    return;
  }

  // Injected at build time
  const STYLES = "__STYLES__";
  const TEMPLATE = "__TEMPLATE__";

  const STORAGE_KEY = "fa_debug_state";
  const COLLAPSED_WIDTH = 40;
  const PANEL_WIDTH = 340;

  // State
  let isCollapsed = false;
  let activeTab = "data";
  let logEntries = [];
  let position = { bottom: 16, right: 16 };

  // Load persisted state
  const loadState = () => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state = JSON.parse(stored);
        isCollapsed = state.isCollapsed ?? false;
        activeTab = state.activeTab ?? "data";
        position = state.position ?? { bottom: 16, right: 16 };
      }
    } catch {
      // Ignore
    }
  };

  // Save state
  const saveState = () => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ isCollapsed, activeTab, position })
      );
    } catch {
      // Ignore
    }
  };

  // Format timestamp
  const formatTime = (date = new Date()) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Add log entry
  const addLog = (message, type = "info") => {
    logEntries.unshift({
      time: formatTime(),
      message,
      type,
    });

    // Keep last 50 entries
    if (logEntries.length > 50) {
      logEntries = logEntries.slice(0, 50);
    }

    updateLogTab();
  };

  // Truncate long values for display
  const truncate = (str, maxLen = 24) => {
    if (!str || str.length <= maxLen) {
      return str || "";
    }
    return `${str.substring(0, maxLen - 3)}...`;
  };

  // Get short path from URL
  const getShortPath = (url) => {
    if (!url) {
      return "";
    }
    try {
      const u = new URL(url, window.location.origin);
      return u.pathname;
    } catch {
      return url;
    }
  };

  // Show temporary success state on button
  const flashSuccess = (btn, duration = 1500) => {
    btn.classList.add("success");
    setTimeout(() => btn.classList.remove("success"), duration);
  };

  // Highlight a form element on the page
  const highlightForm = (formElement) => {
    if (!formElement) {
      return;
    }

    const originalOutline = formElement.style.outline;
    const originalOutlineOffset = formElement.style.outlineOffset;
    const originalTransition = formElement.style.transition;

    formElement.style.transition = "outline-color 0.3s";
    formElement.style.outline = "3px solid hsl(142 76% 36%)";
    formElement.style.outlineOffset = "2px";

    formElement.scrollIntoView({ behavior: "smooth", block: "center" });

    setTimeout(() => {
      formElement.style.outline = "3px solid transparent";
      setTimeout(() => {
        formElement.style.outline = originalOutline;
        formElement.style.outlineOffset = originalOutlineOffset;
        formElement.style.transition = originalTransition;
      }, 300);
    }, 1500);
  };

  // Find form element by selector
  const findFormBySelector = (selector) => {
    if (!selector) {
      return null;
    }
    try {
      return document.querySelector(`form${selector}`);
    } catch {
      return null;
    }
  };

  const el = (tag, attrs = {}, children = []) => {
    const element = document.createElement(tag);

    for (const [key, value] of Object.entries(attrs)) {
      if (key === "class") {
        element.className = value;
      } else if (key === "text") {
        element.textContent = value;
      } else {
        element.setAttribute(key, value);
      }
    }

    for (const child of Array.isArray(children) ? children : [children]) {
      if (typeof child === "string") {
        element.appendChild(document.createTextNode(child));
      } else if (child) {
        element.appendChild(child);
      }
    }

    return element;
  };

  const svg = (paths, size = 12) => {
    const ns = "http://www.w3.org/2000/svg";
    const s = document.createElementNS(ns, "svg");
    s.setAttribute("xmlns", ns);
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("fill", "none");
    s.setAttribute("stroke", "currentColor");
    s.setAttribute("stroke-width", "2");
    s.setAttribute("stroke-linecap", "round");
    s.setAttribute("stroke-linejoin", "round");
    s.style.width = `${size}px`;
    s.style.height = `${size}px`;

    for (const pathData of paths) {
      if (typeof pathData === "string") {
        const path = document.createElementNS(ns, "path");
        path.setAttribute("d", pathData);
        s.appendChild(path);
      } else {
        // Handle rect or other elements
        const elem = document.createElementNS(ns, pathData.type || "path");
        for (const [k, v] of Object.entries(pathData)) {
          if (k !== "type") {
            elem.setAttribute(k, v);
          }
        }
        s.appendChild(elem);
      }
    }

    return s;
  };

  // Icon definitions as path data
  const iconPaths = {
    form: [
      { type: "rect", width: "18", height: "18", x: "3", y: "3", rx: "2" },
      "M9 3v18",
      "M3 9h6",
      "M3 15h6",
    ],
  };

  // Clear all children from an element
  const clearChildren = (element) => {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  };

  // Create the overlay
  const createOverlay = () => {
    const host = document.createElement("div");
    host.id = "fa-debug-overlay";

    const shadow = host.attachShadow({ mode: "closed" });

    // Inject styles and template
    shadow.innerHTML = `
      <style>
        :host {
          --fa-panel-width: ${PANEL_WIDTH}px;
          --fa-collapsed-width: ${COLLAPSED_WIDTH}px;
        }
        ${STYLES}
      </style>
      ${TEMPLATE}
    `;

    // Apply position
    host.style.cssText = `
      position: fixed;
      bottom: ${position.bottom}px;
      right: ${position.right}px;
      z-index: 999999;
    `;

    document.body.appendChild(host);

    return { host, shadow };
  };

  // References
  let host, shadow;
  let panel, collapsed, statusBar, tabData, tabForms, logList;

  // Initialize references
  const initRefs = (s) => {
    panel = s.getElementById("panel");
    collapsed = s.getElementById("collapsed");
    statusBar = s.getElementById("status-bar");
    tabData = s.getElementById("tab-data");
    tabForms = s.getElementById("tab-forms");
    logList = s.getElementById("log-list");
  };

  // Apply persisted state to DOM
  const applyState = (s) => {
    // Apply collapsed state
    panel.classList.toggle("hidden", isCollapsed);
    collapsed.classList.toggle("hidden", !isCollapsed);

    // Apply active tab
    for (const tab of s.querySelectorAll(".tab")) {
      tab.classList.toggle("active", tab.dataset.tab === activeTab);
    }
    for (const content of s.querySelectorAll(".tab-content")) {
      content.classList.toggle("active", content.id === `tab-${activeTab}`);
    }
  };

  // Update status bar
  const updateStatusBar = () => {
    const config = FA.config;
    const data = FA.getData();
    const forms = FA.getForms?.() || [];

    const paramCount = data
      ? Object.keys(data).filter((k) => !k.startsWith("_")).length
      : 0;

    clearChildren(statusBar);

    // Status indicator
    const statusItem1 = el("div", { class: "status-item" }, [
      el("span", { class: `status-dot ${paramCount > 0 ? "" : "inactive"}` }),
      el("span", { text: paramCount > 0 ? "Active" : "No Data" }),
    ]);

    // Storage type
    const statusItem2 = el("div", { class: "status-item" }, [
      el("span", { text: "Storage:" }),
      el("span", { class: "status-value", text: config.storage || "session" }),
    ]);

    // Forms count
    const statusItem3 = el("div", { class: "status-item" }, [
      el("span", { text: "Forms:" }),
      el("span", { class: "status-value", text: String(forms.length) }),
    ]);

    statusBar.append(statusItem1, statusItem2, statusItem3);
  };

  // Create a data row element
  const createDataRow = (key, value, displayValue) => {
    return el("div", { class: "data-row" }, [
      el("span", { class: "data-key", text: key }),
      el("span", { class: "data-value", title: value, text: displayValue }),
    ]);
  };

  // Create a section with header and data rows
  const createDataSection = (title, badge, rows) => {
    const fragment = document.createDocumentFragment();

    const headerChildren = [el("span", { text: title })];
    if (badge) {
      headerChildren.push(el("span", { class: "badge", text: badge }));
    }
    fragment.appendChild(
      el("div", { class: "section-header" }, headerChildren)
    );

    const dataList = el("div", { class: "data-list" });
    for (const row of rows) {
      dataList.appendChild(row);
    }
    fragment.appendChild(dataList);

    return fragment;
  };

  // Update data tab
  const updateDataTab = () => {
    const data = FA.getData();

    clearChildren(tabData);

    if (!data || Object.keys(data).length === 0) {
      tabData.appendChild(
        el("div", { class: "empty", text: "No attribution data available" })
      );
      return;
    }

    const urlParams = [];
    const metaParams = [];
    const metaKeys = [
      "landing_page",
      "current_page",
      "referrer_url",
      "first_touch_timestamp",
    ];

    for (const [key, value] of Object.entries(data)) {
      if (metaKeys.includes(key)) {
        metaParams.push({ key, value });
      } else {
        urlParams.push({ key, value });
      }
    }

    if (urlParams.length > 0) {
      const rows = urlParams.map(({ key, value }) =>
        createDataRow(key, value, truncate(value))
      );
      tabData.appendChild(
        createDataSection(
          "URL Parameters",
          `${urlParams.length} captured`,
          rows
        )
      );
    }

    if (metaParams.length > 0) {
      const rows = metaParams.map(({ key, value }) => {
        const displayKey = key.replace(/_/g, " ");
        const isUrl = key.includes("page") || key.includes("url");
        const displayValue = isUrl
          ? truncate(getShortPath(value), 20)
          : truncate(value);
        return createDataRow(displayKey, value, displayValue);
      });
      tabData.appendChild(createDataSection("Metadata", null, rows));
    }
  };

  // Get form identifier for display
  const getFormIdentifier = (form) => {
    if (form.id) {
      return `#${form.id}`;
    }
    if (form.name) {
      return `[name="${form.name}"]`;
    }
    return form.selector || "[form]";
  };

  // Get form status info
  const getFormStatus = (form) => {
    if (form.excluded) {
      return { className: "excluded", text: "Excluded" };
    }
    if (form.injected) {
      return { className: "injected", text: "Injected" };
    }
    return { className: "ready", text: "Ready" };
  };

  // Create form list item element
  const createFormItem = (form) => {
    const formName = el("div", { class: "form-name" }, [
      svg(iconPaths.form),
      document.createTextNode(` ${getFormIdentifier(form)}`),
    ]);

    const status = getFormStatus(form);
    const formStatus = el("span", {
      class: `form-status ${status.className}`,
      text: status.text,
    });

    const canHighlight = Boolean(form.selector);
    const formItem = el(
      "div",
      {
        class: canHighlight ? "form-item" : "form-item no-highlight",
        title: canHighlight ? "Click to highlight" : "",
      },
      [formName, formStatus]
    );

    if (canHighlight) {
      formItem.addEventListener("click", () => {
        const formElement = findFormBySelector(form.selector);
        if (formElement) {
          highlightForm(formElement);
          addLog(`Highlighted form ${getFormIdentifier(form)}`, "info");
        }
      });
    }

    return formItem;
  };

  // Update forms tab
  const updateFormsTab = () => {
    const forms = FA.getForms?.() || [];

    clearChildren(tabForms);

    if (forms.length === 0) {
      const emptyState = el("div", { class: "empty" }, [
        svg(iconPaths.form, 24),
        document.createTextNode(" No forms found on page"),
      ]);
      tabForms.appendChild(emptyState);
      return;
    }

    const dataList = el("div", { class: "data-list" });

    for (const form of forms) {
      dataList.appendChild(createFormItem(form));
    }

    tabForms.appendChild(dataList);
  };

  // Update log tab
  const updateLogTab = () => {
    if (!logList) {
      return;
    }

    clearChildren(logList);

    if (logEntries.length === 0) {
      logList.appendChild(
        el("div", { class: "empty", text: "No events logged yet" })
      );
      return;
    }

    for (const entry of logEntries) {
      const logEntry = el("div", { class: "log-entry" }, [
        el("span", { class: "log-time", text: entry.time }),
        el("span", { class: `log-msg ${entry.type}`, text: entry.message }),
      ]);
      logList.appendChild(logEntry);
    }
  };

  // Update all tabs
  const updateAll = () => {
    updateStatusBar();
    updateDataTab();
    updateFormsTab();
    updateLogTab();
  };

  // Toggle collapsed state
  const toggleCollapsed = (forceState) => {
    isCollapsed = forceState ?? !isCollapsed;
    panel.classList.toggle("hidden", isCollapsed);
    collapsed.classList.toggle("hidden", !isCollapsed);
    saveState();
  };

  // Setup event listeners
  const setupEvents = (s) => {
    // Tab switching
    for (const tab of s.querySelectorAll(".tab")) {
      tab.addEventListener("click", () => {
        for (const t of s.querySelectorAll(".tab")) {
          t.classList.remove("active");
        }
        for (const c of s.querySelectorAll(".tab-content")) {
          c.classList.remove("active");
        }

        tab.classList.add("active");
        activeTab = tab.dataset.tab;
        s.getElementById(`tab-${activeTab}`).classList.add("active");
        saveState();
      });
    }

    // Minimize
    s.getElementById("btn-minimize").addEventListener("click", () => {
      toggleCollapsed(true);
    });

    // Close
    s.getElementById("btn-close").addEventListener("click", () => {
      host.remove();
      addLog("Debug overlay closed", "warning");
    });

    // Expand from collapsed
    s.getElementById("collapsed").addEventListener("click", () => {
      toggleCollapsed(false);
    });

    // Copy
    const btnCopy = s.getElementById("btn-copy");
    btnCopy.addEventListener("click", async () => {
      const data = FA.getData();
      try {
        await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        flashSuccess(btnCopy);
        addLog("Data copied to clipboard", "success");
      } catch {
        addLog("Failed to copy data", "error");
      }
    });

    // Clear
    const btnClear = s.getElementById("btn-clear");
    btnClear.addEventListener("click", () => {
      FA.clear?.();
      flashSuccess(btnClear);
      addLog("Storage cleared", "warning");
      updateAll();
    });

    // Refresh
    const btnRefresh = s.getElementById("btn-refresh");
    btnRefresh.addEventListener("click", () => {
      FA.refresh?.();
      flashSuccess(btnRefresh);
      addLog("Forms refreshed", "success");
      updateAll();
    });

    // Drag functionality
    let isDragging = false;
    let startX, startY, startRight, startBottom;

    const dragHandle = s.getElementById("drag-handle");

    dragHandle.addEventListener("mousedown", (e) => {
      if (e.target.closest(".ctrl-btn")) {
        return;
      }
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startRight = position.right;
      startBottom = position.bottom;
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) {
        return;
      }

      const deltaX = startX - e.clientX;
      const deltaY = startY - e.clientY;

      position.right = Math.max(
        0,
        Math.min(window.innerWidth - PANEL_WIDTH, startRight + deltaX)
      );
      position.bottom = Math.max(
        0,
        Math.min(window.innerHeight - 200, startBottom + deltaY)
      );

      host.style.right = `${position.right}px`;
      host.style.bottom = `${position.bottom}px`;
    });

    document.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        saveState();
      }
    });
  };

  // Hook into FormAttribution callbacks
  const setupCallbacks = () => {
    if (typeof FA.on === "function") {
      FA.on("onCapture", ({ data }) => {
        const count = Object.keys(data || {}).length;
        addLog(`Captured ${count} parameters`, "success");
        updateAll();
      });

      FA.on("onUpdate", ({ forms, action }) => {
        if (action === "clear") {
          addLog(`Cleared ${forms.length} form(s)`, "info");
        } else {
          addLog(`Injected into ${forms.length} form(s)`, "info");
        }
        updateAll();
      });

      FA.on("onReady", () => {
        addLog("Initialized", "success");
        updateAll();
      });
    }
  };

  // Initialize
  const init = () => {
    loadState();

    const overlay = createOverlay();
    host = overlay.host;
    shadow = overlay.shadow;

    initRefs(shadow);

    // Set docs link from API
    const docsLink = shadow.getElementById("docs-link");
    if (docsLink && FA.docs) {
      docsLink.href = FA.docs;
    }

    applyState(shadow);
    setupEvents(shadow);
    setupCallbacks();

    // Initial log entry
    addLog("Debug overlay loaded", "success");

    // Initial update
    updateAll();
  };

  // Wait for DOM if needed
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
