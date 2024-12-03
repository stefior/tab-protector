document.addEventListener("DOMContentLoaded", function () {
  const addUrlBtn = document.getElementById("addUrl");
  const addCurrentUrlBtn = document.getElementById("addCurrentUrl");
  const protectedUrlsInput = document.getElementById("protectedUrls");
  const protectedUrlsList = document.getElementById("protectedUrlsList");
  const currentUrlDisplay = document.querySelector(".current-url");
  const messageElement = document.querySelector(".message");

  // Focus on the input field when the popup opens
  protectedUrlsInput.focus();

  // Get and display current URL
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentUrl = tabs[0].url;
    currentUrlDisplay.textContent = normalizeUrl(currentUrl);
  });

  function normalizeUrl(url) {
    // Remove protocol and trailing slash
    url = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
    // Remove 'www.' if present
    return url.replace(/^www\./, "");
  }

  function validateUrl(url) {
    try {
      new URL("https://" + normalizeUrl(url));
      return true;
    } catch (e) {
      return false;
    }
  }

  function getUrlParts(url) {
    // Split URL into domain parts and path
    const [domain, ...pathParts] = url.split("/");
    const path = pathParts.length > 0 ? "/" + pathParts.join("/") : "";

    // Split domain into parts
    const domainParts = domain.split(".");

    // Get second level domain for sorting
    const sld =
      domainParts.length > 1
        ? domainParts[domainParts.length - 2]
        : domainParts[0];

    // Get subdomain (everything before the second level domain)
    const subdomain = domainParts.slice(0, -2).join(".");

    return { sld, subdomain, path };
  }

  // Initial setup of the protected URLs list
  function setupProtectedUrlsList() {
    chrome.storage.sync.get(["protectedUrls"], function (result) {
      const protectedUrls = result.protectedUrls || [];
      protectedUrlsList.innerHTML = "";

      // Sort URLs
      const sortedUrls = [...protectedUrls].sort((a, b) => {
        const partsA = getUrlParts(a);
        const partsB = getUrlParts(b);

        // Compare second level domains
        if (partsA.sld !== partsB.sld) {
          return partsA.sld.localeCompare(partsB.sld);
        }

        // Compare subdomains
        if (partsA.subdomain !== partsB.subdomain) {
          return partsA.subdomain.localeCompare(partsB.subdomain);
        }

        // Compare paths
        return partsA.path.localeCompare(partsB.path);
      });

      // Create the initial list
      sortedUrls.forEach(createUrlItem);
      setupRemoveHandlers();
    });
  }

  function createUrlItem(url) {
    const urlDiv = document.createElement("div");
    urlDiv.className = "site";
    urlDiv.dataset.url = url;

    const urlSpan = document.createElement("span");
    urlSpan.className = "url-text";
    urlSpan.textContent = url;

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "Remove";
    removeBtn.setAttribute("data-url", url);

    urlDiv.appendChild(urlSpan);
    urlDiv.appendChild(removeBtn);
    protectedUrlsList.appendChild(urlDiv);
    
    return urlDiv;
  }

  function setupRemoveHandlers() {
    document.querySelectorAll(".remove-btn").forEach((button, index) => {
      // Remove any existing click listeners
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      
      newButton.addEventListener("click", function() {
        const urlToRemove = this.getAttribute("data-url");
        const currentSite = this.closest('.site');
        const nextSite = currentSite.nextElementSibling || currentSite.previousElementSibling;
        
        chrome.storage.sync.get(["protectedUrls"], function(result) {
          const updatedUrls = result.protectedUrls.filter(u => u !== urlToRemove);
          chrome.storage.sync.set({ protectedUrls: updatedUrls }, function() {
            currentSite.remove();
            if (nextSite) {
              nextSite.querySelector('.remove-btn').focus();
            }
          });
        });
      });
    });
  }

  // Modified version of updateProtectedUrlsList that handles incremental updates
  function updateProtectedUrlsList() {
    chrome.storage.sync.get(["protectedUrls"], function (result) {
      const protectedUrls = new Set(result.protectedUrls || []);
      
      // Remove items that are no longer in the list
      document.querySelectorAll('.site').forEach(site => {
        const url = site.dataset.url;
        if (!protectedUrls.has(url)) {
          site.remove();
        }
      });

      // Add new items that aren't already in the DOM
      const existingUrls = new Set(
        Array.from(document.querySelectorAll('.site')).map(site => site.dataset.url)
      );

      const sortedNewUrls = [...protectedUrls]
        .filter(url => !existingUrls.has(url))
        .sort((a, b) => {
          const partsA = getUrlParts(a);
          const partsB = getUrlParts(b);
          if (partsA.sld !== partsB.sld) return partsA.sld.localeCompare(partsB.sld);
          if (partsA.subdomain !== partsB.subdomain) return partsA.subdomain.localeCompare(partsB.subdomain);
          return partsA.path.localeCompare(partsB.path);
        });

      sortedNewUrls.forEach(createUrlItem);
      setupRemoveHandlers();
    });
  }

  function showMessage(message, type) {
    messageElement.className = `message ${type}-message`;
    messageElement.textContent = message;
    
    requestAnimationFrame(() => {
      messageElement.style.opacity = "1";
    });

    setTimeout(() => {
      messageElement.style.opacity = "0";
    }, 3000);
  }

  function addNewUrl() {
    let newUrl = protectedUrlsInput.value.trim();
    if (!newUrl) return;

    newUrl = normalizeUrl(newUrl);

    if (!validateUrl(newUrl)) {
      showMessage("Please enter a valid URL (e.g., example.com/path)", "error");
      return;
    }

    chrome.storage.sync.get(["protectedUrls"], function (result) {
      const protectedUrls = result.protectedUrls || [];

      const isAlreadyProtected = protectedUrls.some((existingUrl) => {
        return newUrl.startsWith(existingUrl);
      });

      if (isAlreadyProtected) {
        showMessage("This URL or a parent path is already protected", "error");
        return;
      }

      protectedUrls.push(newUrl);
      chrome.storage.sync.set({ protectedUrls: protectedUrls }, function () {
        updateProtectedUrlsList();
        protectedUrlsInput.value = "";
        showMessage("URL added successfully", "success");
      });
    });
  }

  function addCurrentSite() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentUrl = tabs[0].url;
      const normalizedUrl = normalizeUrl(currentUrl);

      chrome.storage.sync.get(["protectedUrls"], function (result) {
        const protectedUrls = result.protectedUrls || [];

        const isAlreadyProtected = protectedUrls.some((existingUrl) => {
          return normalizedUrl.startsWith(existingUrl);
        });

        if (isAlreadyProtected) {
          showMessage("This URL or a parent path is already protected", "error");
          return;
        }

        protectedUrls.push(normalizedUrl);
        chrome.storage.sync.set({ protectedUrls: protectedUrls }, function () {
          updateProtectedUrlsList();
          showMessage("Current site added successfully", "success");
        });
      });
    });
  }

  addUrlBtn.addEventListener("click", addNewUrl);
  addCurrentUrlBtn.addEventListener("click", addCurrentSite);

  protectedUrlsInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      addNewUrl();
    }
  });

  updateProtectedUrlsList();
});
