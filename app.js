// SmartStock AI - Antigravity Framework + Gemma Integration
"use strict";

// ─── State ────────────────────────────────────────────────────────────────────
const state = {
  inventory: [],
  currentResult: null,
  apiKey: "AIzaSyCDzSSpiejw7EA4sanaE-GVVxCZHBxYvc0", // Provided by User
};

// ─── Navigation ───────────────────────────────────────────────────────────────
function showPage(name) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
  document.querySelectorAll(".bottom-nav-item").forEach(b => b.classList.remove("active"));

  const page = document.getElementById("page-" + name);
  if (page) page.classList.add("active");

  const link = document.querySelector(`.nav-link[href="#${name}"]`);
  if (link) link.classList.add("active");

  const bnavBtn = document.getElementById("bnav-" + name);
  if (bnavBtn) bnavBtn.classList.add("active");

  if (name === "analytics") renderAnalytics();
  window.scrollTo({ top: 0, behavior: "smooth" });
  closeMenu();
}

function toggleMenu() {
  const nav = document.getElementById("navLinks");
  if (nav) nav.classList.toggle("open");
}
function closeMenu() {
  const nav = document.getElementById("navLinks");
  if (nav) nav.classList.remove("open");
}

// ─── Counter Animation ────────────────────────────────────────────────────────
function animateCounters() {
  document.querySelectorAll(".stat-number[data-target]").forEach(el => {
    const target = +el.dataset.target;
    let current = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { el.textContent = target; clearInterval(timer); }
      else el.textContent = Math.floor(current);
    }, 20);
  });
}

// ─── Mini Chart (Hero) ────────────────────────────────────────────────────────
function drawMiniChart() {
  const container = document.getElementById("miniChart");
  if (!container) return;
  const points = [40, 65, 45, 80, 60, 90, 70, 85, 75, 95];
  const w = container.offsetWidth || 280, h = 100;
  const step = w / (points.length - 1);
  const max = Math.max(...points);
  const svgPoints = points.map((v, i) => `${i * step},${h - (v / max) * h * 0.9}`).join(" ");
  const areaPoints = `0,${h} ${svgPoints} ${(points.length - 1) * step},${h}`;

  container.innerHTML = `<svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <defs>
      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#60a5fa" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#60a5fa" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <polygon points="${areaPoints}" fill="url(#chartGrad)"/>
    <polyline points="${svgPoints}" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    ${points.map((v, i) => i === points.length - 1 ? `<circle cx="${i * step}" cy="${h - (v / max) * h * 0.9}" r="4" fill="#60a5fa"/>` : "").join("")}
  </svg>`;
}

// ─── Antigravity Pipeline Simulator ──────────────────────────────────────────
function resetPipeline() {
  [1, 2, 3, 4].forEach(i => {
    const step = document.getElementById("pipe" + i);
    if (step) step.classList.remove("active", "done");
    const status = document.getElementById("pipe" + i + "-status");
    if (status) status.textContent = "Waiting...";
  });
  const fill = document.getElementById("latencyFill");
  if (fill) fill.style.width = "0%";
  const val = document.getElementById("latencyValue");
  if (val) val.textContent = "-- ms";
}

function activateStep(i, statusText) {
  return new Promise(resolve => {
    setTimeout(() => {
      [1, 2, 3, 4].forEach(j => {
        const step = document.getElementById("pipe" + j);
        const status = document.getElementById("pipe" + j + "-status");
        if (j < i && step) { 
            step.classList.remove("active"); 
            step.classList.add("done"); 
            if (status) status.textContent = "✓ Complete"; 
        }
        if (j === i && step) { 
            step.classList.add("active"); 
            if (status) status.textContent = statusText; 
        }
      });
      resolve();
    }, 400); // Reduced delay for faster orchestration feel
  });
}

// ─── Data Cleaning (Antigravity Layer) ───────────────────────────────────────
function cleanAndFormat(raw) {
  const cleaned = {
    product: (raw.productName || "Unknown Product").trim(),
    current_stock: parseFloat(raw.currentStock) || 0,
    unit: raw.unit || "units",
    daily_sales_avg: parseFloat(raw.dailySales) || 1,
    reorder_point: parseFloat(raw.reorderPoint) || 10,
    sales_trend: raw.salesTrend
      ? raw.salesTrend.split(",").map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
      : [],
    context: (raw.context || "").trim(),
    timestamp: new Date().toISOString(),
  };
  cleaned.days_until_stockout = Math.floor(cleaned.current_stock / (cleaned.daily_sales_avg || 1));
  cleaned.trend_direction = cleaned.sales_trend.length > 1
    ? (cleaned.sales_trend[cleaned.sales_trend.length - 1] > cleaned.sales_trend[0] ? "rising" : "falling")
    : "stable";
  return cleaned;
}

// ─── Gemma Prompt Builder ────────────────────────────────────────────────────
function buildGemmaPrompt(data) {
  return `You are a professional AI inventory advisor. Analyze this data for a small business and provide a very concise prediction.

Product: ${data.product}
Stock: ${data.current_stock} ${data.unit}
Daily Sales: ${data.daily_sales_avg}
Context: ${data.context || "None"}

Format:
HEADLINE: [Actionable prediction]
RECOMMENDATION: [Quantity and timing]
RISK: [Low/Medium/High]
WHY: [1-2 sentences]`;
}

// ─── Call AI via Google AI Studio API (with Gemma Priority) ─────────────────
async function callGemmaAPI(prompt) {
  if (!state.apiKey) {
    throw new Error("API Key missing.");
  }
  
  // Priority: gemma-2-9b-it (Very reliable for the demo success view)
  const models = ["gemma-2-9b-it", "gemini-1.5-flash"];
  let lastError = null;

  for (const modelId of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${state.apiKey}`;
    const body = { contents: [{ parts: [{ text: prompt }] }] };
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); 

    try {
      console.log(`Antigravity Bridge: Attempting inference with ${modelId}...`);
      const res = await fetch(url, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(body),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (res.ok) {
          const json = await res.json();
          console.log(`✓ Success with ${modelId}`);
          return json.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
      } else {
          const errJson = await res.json();
          lastError = errJson.error?.message || res.status;
          console.warn(`! ${modelId} failed: ${lastError}`);
          // Continue to next model in loop
      }
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err.message;
      console.warn(`! ${modelId} error: ${lastError}`);
      // Continue to next model
    }
  }

  throw new Error(`AI Inference failed: ${lastError}. Please check your API key and network.`);
}

// ─── Main Prediction Runner ────────────────────────────────────────────────────
async function runPrediction() {
  const btn = document.getElementById("predictBtn");
  const raw = {
    productName: document.getElementById("productName").value,
    currentStock: document.getElementById("currentStock").value,
    unit: document.getElementById("unit").value,
    dailySales: document.getElementById("dailySales").value,
    reorderPoint: document.getElementById("reorderPoint").value,
    salesTrend: document.getElementById("salesTrend").value,
    context: document.getElementById("context").value,
  };

  if (!raw.productName || !raw.currentStock || !raw.dailySales) {
    showToast("⚠️ Please fill in all required fields.");
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span>Processing...</span>';
  resetPipeline();

  const resultPlaceholder = document.getElementById("resultPlaceholder");
  const resultContent = document.getElementById("resultContent");
  if (resultContent) resultContent.style.display = "none";
  if (resultPlaceholder) resultPlaceholder.style.display = "block";

  const startTime = Date.now();
  const latencyVal = document.getElementById("latencyValue");
  const latencyFill = document.getElementById("latencyFill");
  
  const timerInterval = setInterval(() => {
    const now = Date.now() - startTime;
    if (latencyVal) latencyVal.textContent = now + " ms";
    if (latencyFill) latencyFill.style.width = Math.min(100, (now / 5000) * 100) + "%";
  }, 50);

  try {
    // Step 1: Data Cleaning
    await activateStep(1, "Pre-processing data...");
    const cleanedData = cleanAndFormat(raw);

    // Step 2: JSON Formatting
    await activateStep(2, "Optimizing payload...");
    const prompt = buildGemmaPrompt(cleanedData);

    // Step 3: API Bridge
    await activateStep(3, "Connecting to Antigravity Bridge...");

    // Step 4: AI Inference
    await activateStep(4, "Streaming insights via Gemma...");
    const result = await callGemmaAPI(prompt);

    clearInterval(timerInterval);
    const elapsed = Date.now() - startTime;

    // Mark all done
    [1, 2, 3, 4].forEach(i => {
      const step = document.getElementById("pipe" + i);
      const status = document.getElementById("pipe" + i + "-status");
      if (step) {
          step.classList.remove("active");
          step.classList.add("done");
      }
      if (status) status.textContent = "✓ Complete";
    });

    if (latencyVal) latencyVal.textContent = elapsed + " ms";

    state.currentResult = { data: cleanedData, response: result, time: elapsed };
    displayResult(result, cleanedData, elapsed);

  } catch (err) {
    clearInterval(timerInterval);
    showToast("❌ AI Error: " + err.message);
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg><span>Run AI Prediction</span>';
  }
}

function displayResult(text, data, elapsed) {
  const highlight = document.getElementById("predictionHighlight");
  const pText = document.getElementById("predictionText");
  const meta = document.getElementById("resultMeta");
  const placeholder = document.getElementById("resultPlaceholder");
  const content = document.getElementById("resultContent");

  // Simple headline extraction
  const cleanHeadline = text.split('\n')[0].replace(/^1\.\s*HEADLINE:\s*/i, "").replace(/\*\*/g, "").trim();

  if (highlight) highlight.textContent = cleanHeadline;
  if (pText) pText.textContent = text.replace(/^.*HEADLINE.*\n?/i, "").trim();
  if (meta) meta.textContent = `AI via Antigravity Bridge · ${elapsed}ms · ${new Date().toLocaleTimeString()}`;
  if (placeholder) placeholder.style.display = "none";
  if (content) content.style.display = "block";
  
  showToast("✅ Prediction complete in " + elapsed + "ms");
}

// ─── Inventory Management ──────────────────────────────────────────────────────
function addToInventory() {
  if (!state.currentResult) return;
  const d = state.currentResult.data;
  const days = d.days_until_stockout;
  const status = days <= 2 ? "critical" : days <= 5 ? "low" : "healthy";
  
  const highlight = document.getElementById("predictionHighlight");
  
  state.inventory.push({
    product: d.product, stock: d.current_stock, unit: d.unit,
    dailySales: d.daily_sales_avg, days, status,
    recommendation: highlight ? highlight.textContent : "Restock suggested"
  });
  renderInventoryTable();
  renderAnalytics();
  showToast("📦 Added to inventory dashboard!");
}

function renderInventoryTable() {
  const tbody = document.getElementById("inventoryBody");
  if (!tbody) return;
  
  if (!state.inventory.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No inventory items yet. Add items using the predictor above.</td></tr>';
    return;
  }
  tbody.innerHTML = state.inventory.map((item, i) => {
    const badgeClass = item.status === "healthy" ? "status-badge-green" : item.status === "low" ? "status-badge-yellow" : "status-badge-red";
    const statusLabel = item.status === "healthy" ? "✅ Healthy" : item.status === "low" ? "⚠️ Low Stock" : "🚨 Critical";
    return `<tr>
      <td><strong>${item.product}</strong></td>
      <td>${item.stock} ${item.unit}</td>
      <td>${item.dailySales} ${item.unit}/day</td>
      <td>${item.days} days</td>
      <td><span class="${badgeClass}">${statusLabel}</span></td>
      <td style="color:var(--muted);font-size:.82rem;max-width:200px;">${item.recommendation}</td>
    </tr>`;
  }).join("");
}

function clearInventory() {
  if (!confirm("Clear all inventory items?")) return;
  state.inventory = [];
  renderInventoryTable();
  renderAnalytics();
  showToast("🗑️ Inventory cleared.");
}

function exportResult() {
  if (!state.currentResult) return;
  const content = `SmartStock AI - Prediction Report\n${"=".repeat(40)}\nProduct: ${state.currentResult.data.product}\nGenerated: ${new Date().toLocaleString()}\nLatency: ${state.currentResult.time}ms (Antigravity Bridge)\n\n${state.currentResult.response}`;
  const blob = new Blob([content], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `smartstock-${state.currentResult.data.product.replace(/\s+/g, "-")}-${Date.now()}.txt`;
  a.click();
  showToast("📄 Report exported!");
}

// ─── Analytics ────────────────────────────────────────────────────────────────
function renderAnalytics() {
  const total = state.inventory.length;
  const healthy = state.inventory.filter(i => i.status === "healthy").length;
  const low = state.inventory.filter(i => i.status === "low").length;
  const critical = state.inventory.filter(i => i.status === "critical").length;

  const tEl = document.getElementById("totalItems");
  const hEl = document.getElementById("healthyItems");
  const lEl = document.getElementById("lowItems");
  const cEl = document.getElementById("criticalItems");

  if (tEl) tEl.textContent = total;
  if (hEl) hEl.textContent = healthy;
  if (lEl) lEl.textContent = low;
  if (cEl) cEl.textContent = critical;

  drawStockChart();
  drawStatusChart();
}

function drawStockChart() {
  const canvas = document.getElementById("stockChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const items = state.inventory.length ? state.inventory : [
    { product: "Rice", days: 14 }, { product: "Sugar", days: 4 },
    { product: "Oil", days: 1 }, { product: "Flour", days: 9 }, { product: "Salt", days: 20 }
  ];
  const barW = (w - 60) / items.length - 10;
  const maxDays = Math.max(...items.map(i => i.days || 0), 20);

  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = 20 + ((h - 60) / 4) * i;
    ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(w - 10, y); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "10px Inter";
    ctx.fillText(Math.round(maxDays - (maxDays / 4) * i), 0, y + 4);
  }

  items.forEach((item, i) => {
    const x = 50 + i * (barW + 10);
    const barH = ((item.days || 0) / maxDays) * (h - 60);
    const y = h - 40 - barH;
    const color = (item.days || 0) <= 2 ? "#f87171" : (item.days || 0) <= 5 ? "#fbbf24" : "#34d399";
    const grad = ctx.createLinearGradient(0, y, 0, h - 40);
    grad.addColorStop(0, color);
    grad.addColorStop(1, color + "40");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "9px Inter";
    ctx.textAlign = "center";
    ctx.fillText((item.product || "Item").substring(0, 6), x + barW / 2, h - 22);
  });
}

function drawStatusChart() {
  const canvas = document.getElementById("statusChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const healthy = state.inventory.filter(i => i.status === "healthy").length || 2;
  const low = state.inventory.filter(i => i.status === "low").length || 1;
  const critical = state.inventory.filter(i => i.status === "critical").length || 1;
  const total = healthy + low + critical;
  const cx = w / 2, cy = h / 2 - 10, r = Math.min(cx, cy) - 20;

  const segments = [
    { val: healthy, color: "#34d399", label: "Healthy" },
    { val: low, color: "#fbbf24", label: "Low" },
    { val: critical, color: "#f87171", label: "Critical" },
  ];
  let angle = -Math.PI / 2;
  segments.forEach(s => {
    const slice = (s.val / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.closePath();
    ctx.fillStyle = s.color;
    ctx.fill();
    ctx.strokeStyle = "#0a0f1e";
    ctx.lineWidth = 3;
    ctx.stroke();
    angle += slice;
  });

  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.55, 0, 2 * Math.PI);
  ctx.fillStyle = "#111827";
  ctx.fill();
  ctx.fillStyle = "#f1f5f9";
  ctx.font = "bold 14px Space Grotesk";
  ctx.textAlign = "center";
  ctx.fillText(total, cx, cy + 5);

  segments.forEach((s, i) => {
    ctx.fillStyle = s.color;
    ctx.fillRect(20, h - 40 + i * 14, 10, 10);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "10px Inter";
    ctx.textAlign = "left";
    ctx.fillText(`${s.label} (${s.val})`, 36, h - 31 + i * 14);
  });
}

async function generateInsights() {
  const body = document.getElementById("insightsBody");
  if (!body) return;
  body.innerHTML = '<p class="insights-placeholder">🧠 Generating insights via Antigravity → AI...</p>';

  try {
    const total = state.inventory.length;
    const critical = state.inventory.filter(i => i.status === "critical");
    
    let aiInsights = "";
    if (total > 0) {
        const inventoryData = state.inventory.map(i => `${i.product}: ${i.stock} ${i.unit} (${i.status})`).join(", ");
        const prompt = `Based on this small business inventory: ${inventoryData}. Provide 3 short, strategic business insights. Use bullet points. Keep it professional.`;
        aiInsights = await callGemmaAPI(prompt);
    }

    const insights = [
        { icon: "📈", title: "Sales Velocity", text: total > 0 ? `You are tracking ${total} products. ${critical.length > 0 ? critical.length + " products need urgent restocking." : "All products are within safe levels."}` : "Add inventory items to get personalized sales velocity analysis." },
        { icon: "💡", title: "AI Strategy", text: aiInsights || "Consider implementing a weekly reorder schedule based on your top sellers. This reduces stockout risk by up to 40%." },
        { icon: "💰", title: "Cost Optimization", text: "Bulk ordering your top 3 products could reduce procurement costs by 8-12%." },
    ];

    body.innerHTML = insights.map(i => `<div class="insight-item"><strong>${i.icon} ${i.title}</strong><br/><span style="font-size:.85rem">${i.text}</span></div>`).join("");
  } catch (err) {
    body.innerHTML = '<p class="insights-placeholder">⚠️ Error generating insights. Check API key.</p>';
  }
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

// ─── API Key Setup ────────────────────────────────────────────────────────────
function promptApiKey() {
  const key = prompt("Enter your Google AI Studio API key (current key is set):");
  if (key !== null && key.trim() !== "") {
    state.apiKey = key.trim();
    showToast("🔑 API key updated!");
  }
}

// ─── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  animateCounters();
  drawMiniChart();
  renderInventoryTable();

  window.addEventListener("scroll", () => {
    const nav = document.getElementById("navbar");
    if (nav) {
        nav.style.background = window.scrollY > 20
          ? "rgba(10,15,30,0.98)"
          : "rgba(10,15,30,0.9)";
    }
  });

  console.log("%cSmartStock AI — Antigravity Framework", "color:#60a5fa;font-size:16px;font-weight:bold;");
});
