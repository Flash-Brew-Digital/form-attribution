function initDocsNavigation() {
  const sections = document.querySelectorAll(".docs-section");
  const navLinks = document.querySelectorAll(".docs-nav-list a");

  if (sections.length === 0 || navLinks.length === 0) {
    return;
  }

  const observerOptions = {
    rootMargin: "-20% 0px -60% 0px",
    threshold: 0,
  };

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute("id");
        for (const link of navLinks) {
          link.classList.toggle(
            "active",
            link.getAttribute("href") === `#${id}`
          );
        }
      }
    }
  }, observerOptions);

  for (const section of sections) {
    observer.observe(section);
  }
}

function initOpenInChat() {
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

    if (!trigger) {
      continue;
    }
    if (!content) {
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
      const isOpen = open ?? dropdown.dataset.state !== "open";
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

    // Keyboard navigation
    content.addEventListener("keydown", (e) => {
      const focusableItems = [...content.querySelectorAll("a, button")];
      const currentIndex = focusableItems.indexOf(document.activeElement);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % focusableItems.length;
        focusableItems[nextIndex]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex =
          currentIndex <= 0 ? focusableItems.length - 1 : currentIndex - 1;
        focusableItems[prevIndex]?.focus();
      }
    });
  }
}

function initCopyButtons() {
  // Add styles for copy button
  const style = document.createElement("style");
  style.textContent = `
    .code-block { position: relative; }
    .code-copy-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      padding: 0;
      border: 1px solid var(--border);
      border-radius: calc(var(--radius) - 2px);
      background-color: var(--background);
      color: var(--muted-foreground);
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.15s, background-color 0.15s, color 0.15s;
    }
    .code-block:hover .code-copy-btn { opacity: 1; }
    .code-copy-btn:hover {
      background-color: var(--accent);
      color: var(--foreground);
    }
    .code-copy-btn svg { width: 14px; height: 14px; }
    .code-copy-btn .icon-check {
      display: none;
      color: hsl(142 70% 45%);
    }
    .code-copy-btn.copied .icon-copy { display: none; }
    .code-copy-btn.copied .icon-check { display: block; }
  `;
  document.head.appendChild(style);

  // Skip the first code block (CDN script tag in Quick Start)
  const blocks = document.querySelectorAll(".code-block");
  let isFirst = true;

  for (const block of blocks) {
    // Skip the first code block
    if (isFirst) {
      isFirst = false;
      continue;
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "code-copy-btn";
    btn.setAttribute("aria-label", "Copy code to clipboard");
    btn.innerHTML = `
      <svg class="icon-copy" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
      </svg>
      <svg class="icon-check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M20 6 9 17l-5-5"/>
      </svg>
    `;

    btn.addEventListener("click", async () => {
      const code = block.querySelector("code")?.textContent || "";
      try {
        await navigator.clipboard.writeText(code);
        btn.classList.add("copied");
        setTimeout(() => btn.classList.remove("copied"), 1500);
      } catch {
        // Fallback silent fail
      }
    });

    block.appendChild(btn);
  }
}

const init = () => {
  initDocsNavigation();
  initOpenInChat();
  initCopyButtons();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
