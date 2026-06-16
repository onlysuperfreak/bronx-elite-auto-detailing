const STORAGE_KEY = "bronxEliteLeads";
const TRACKING_KEY = "bronxEliteTracking";

const form = document.querySelector("#leadForm");
const formStatus = document.querySelector("#formStatus");
const packageSelect = document.querySelector("#package");
const clearButton = document.querySelector("#clearLeads");

const tracking = getTracking();
populateTrackingFields(tracking);
setMinimumDate();
renderDashboard();

document.querySelectorAll("[data-package-link]").forEach((link) => {
  link.addEventListener("click", () => {
    packageSelect.value = link.dataset.packageLink;
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const lead = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    createdAt: new Date().toISOString(),
    name: data.get("name").trim(),
    phone: data.get("phone").trim(),
    email: data.get("email").trim(),
    vehicle: data.get("vehicle"),
    package: data.get("package"),
    zip: data.get("zip").trim(),
    date: data.get("date"),
    message: data.get("message").trim(),
    source: data.get("utmSource") || "direct",
    medium: data.get("utmMedium") || "none",
    campaign: data.get("utmCampaign") || "none"
  };

  const leads = getLeads();
  leads.unshift(lead);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));

  form.reset();
  populateTrackingFields(tracking);
  setMinimumDate();
  formStatus.textContent = "Lead saved. Dashboard updated.";
  renderDashboard();
});

clearButton.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  formStatus.textContent = "Demo leads cleared.";
  renderDashboard();
});

function getTracking() {
  const params = new URLSearchParams(window.location.search);
  const captured = {
    source: params.get("utm_source") || params.get("source") || "",
    medium: params.get("utm_medium") || "",
    campaign: params.get("utm_campaign") || ""
  };

  if (captured.source || captured.medium || captured.campaign) {
    localStorage.setItem(TRACKING_KEY, JSON.stringify(captured));
    return captured;
  }

  const saved = localStorage.getItem(TRACKING_KEY);
  if (!saved) {
    return { source: "direct", medium: "none", campaign: "none" };
  }

  try {
    return JSON.parse(saved);
  } catch {
    return { source: "direct", medium: "none", campaign: "none" };
  }
}

function populateTrackingFields(values) {
  document.querySelector("#utmSource").value = values.source || "direct";
  document.querySelector("#utmMedium").value = values.medium || "none";
  document.querySelector("#utmCampaign").value = values.campaign || "none";
}

function setMinimumDate() {
  const dateInput = document.querySelector("#date");
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const localDate = new Date(today.getTime() - offset * 60000).toISOString().slice(0, 10);
  dateInput.min = localDate;
}

function getLeads() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function renderDashboard() {
  const leads = getLeads();
  const packageCounts = countBy(leads, "package");
  const sourceCounts = countBy(leads, "source");
  const topPackage = getTopLabel(packageCounts);
  const topSource = getTopLabel(sourceCounts);

  document.querySelector("#totalLeads").textContent = leads.length;
  document.querySelector("#topPackage").textContent = topPackage || "None";
  document.querySelector("#topSource").textContent = topSource || "Direct";

  renderBreakdown("#packageBreakdown", packageCounts, leads.length, [
    "Essential Reset",
    "Elite Deep Clean",
    "Signature Protection",
    "Monthly Maintenance"
  ]);
  renderBreakdown("#sourceBreakdown", sourceCounts, leads.length, ["direct", "google", "facebook", "instagram", "email"]);
  renderRecentLeads(leads);
}

function countBy(items, key) {
  return items.reduce((counts, item) => {
    const label = item[key] || "Unknown";
    counts[label] = (counts[label] || 0) + 1;
    return counts;
  }, {});
}

function getTopLabel(counts) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

function renderBreakdown(selector, counts, total, preferredOrder) {
  const container = document.querySelector(selector);
  const labels = [...new Set([...preferredOrder, ...Object.keys(counts)])];

  container.innerHTML = labels.map((label) => {
    const count = counts[label] || 0;
    const percent = total ? Math.round((count / total) * 100) : 0;
    return `
      <div class="breakdown-row">
        <header><span>${escapeHtml(label)}</span><strong>${count}</strong></header>
        <div class="bar" aria-hidden="true"><span style="width: ${percent}%"></span></div>
      </div>
    `;
  }).join("");
}

function renderRecentLeads(leads) {
  const container = document.querySelector("#recentLeads");
  const recent = leads.slice(0, 5);

  if (!recent.length) {
    container.innerHTML = '<div class="lead-row"><strong>No leads yet</strong><span>Submit the booking form to populate this dashboard.</span></div>';
    return;
  }

  container.innerHTML = recent.map((lead) => `
    <div class="lead-row">
      <strong>${escapeHtml(lead.name)} · ${escapeHtml(lead.package)}</strong>
      <span>${escapeHtml(lead.vehicle)} in ${escapeHtml(lead.zip)} · ${escapeHtml(lead.source)} / ${escapeHtml(lead.medium)}</span>
      <span>${formatDate(lead.createdAt)} · Preferred ${escapeHtml(lead.date)}</span>
    </div>
  `).join("");
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
