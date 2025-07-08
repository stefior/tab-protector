let notificationTimeout;

// Sites that require capture phase handling due to custom event frameworks
const CAPTURE_PHASE_SITES = new Set(["remotedesktop.google.com"]);

function showNotification(message) {
  clearTimeout(notificationTimeout);

  let notification = document.getElementById("tab-protector-notification");
  if (!notification) {
    notification = document.createElement("div");
    notification.id = "tab-protector-notification";
    document.body.appendChild(notification);
  }

  notification.innerHTML = `
    <strong>Tab Protector</strong><br>
    ${message}
  `;

  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, hsl(122, 40%, 25%), hsl(122, 40%, 45%));
    color: white;
    padding: 12px 15px;
    border-radius: 8px;
    z-index: 999999;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    font-family: Roboto, 'Helvetica Neue', sans-serif;
    font-size: 14px;
    max-width: 300px;
    opacity: 0;
    transform: translateX(20px);
    transition: opacity 0.3s ease-out, transform 0.3s ease-out;
    pointer-events: none;
    user-select: none;
  `;

  // Force a reflow before changing the opacity for the animation to work
  notification.offsetHeight;
  notification.style.opacity = "1";
  notification.style.transform = "translateX(0)";

  notificationTimeout = setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateX(20px)";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 4000);
}

function normalizeUrl(url) {
  // Remove protocol and trailing slash
  url = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  // Remove 'www.' if present and convert to lowercase
  return url.replace(/^www\./, "").toLowerCase();
}

function isUrlProtected(currentUrl, protectedUrls) {
  const normalizedCurrentUrl = normalizeUrl(currentUrl);
  return protectedUrls.some((protectedUrl) =>
    normalizedCurrentUrl.startsWith(protectedUrl),
  );
}

function preventClose(event) {
  event.preventDefault();
  event.returnValue = "";
  showNotification(
    "Tab close prevented! Use browser dialog if you really want to close.",
  );
  return event.returnValue;
}

// Special handler for sites with custom event frameworks
function preventCloseCapture(event) {
  event.stopImmediatePropagation();
  return preventClose(event);
}

function preventRefresh(event) {
  if (
    (event.ctrlKey && event.key.toLowerCase() === "r") ||
    event.key === "F5"
  ) {
    event.preventDefault();
    event.stopPropagation();
    showNotification(
      "Page refresh prevented! Protection is active on this page.",
    );
  }
}

function applyProtection() {
  chrome.storage.sync.get(["protectedUrls"], function (result) {
    const protectedUrls = result.protectedUrls || [];
    const needsCapturePhase = CAPTURE_PHASE_SITES.has(window.location.hostname);

    if (isUrlProtected(window.location.href, protectedUrls)) {
      // Sites with custom event frameworks need capture phase handling
      if (needsCapturePhase) {
        window.addEventListener("beforeunload", preventCloseCapture, true);
      } else {
        window.addEventListener("beforeunload", preventClose);
      }
      document.addEventListener("keydown", preventRefresh);
    } else {
      if (needsCapturePhase) {
        window.removeEventListener("beforeunload", preventCloseCapture, true);
      } else {
        window.removeEventListener("beforeunload", preventClose);
      }
      document.removeEventListener("keydown", preventRefresh);
    }
  });
}

// Initial protection check
applyProtection();

// Listen for changes in storage
chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (namespace === "sync" && changes.protectedUrls) {
    applyProtection();
  }
});
