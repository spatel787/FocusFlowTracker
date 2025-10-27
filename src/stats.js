/*import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import Chart from 'chart.js/auto';
import './stats.css';

const CATEGORY_MAP = [
  { name: 'Entertainment', tokens: ['youtube.com', 'netflix.com', 'twitch.tv'] },
  { name: 'Games', tokens: ['roblox.com', 'coolmathgames.com'] },
  { name: 'Social Networking', tokens: ['instagram.com', 'twitter.com', 'discord.com', 'x.com'] },
  { name: 'Shopping', tokens: ['amazon.com', 'ebay.com', 'walmart.com', 'temu.com'] },
  { name: 'Productivity', tokens: ['wikipedia.org', 'github.com', 'gitlab.com', 'docs.google.com', 'drive.google.com', 'bank'] },
  { name: 'Generative AI', tokens: ['openai.com', 'perplexity.ai', 'gemini.google.com'] },
  { name: 'Other', tokens: [] }
];

function categorizeDomain(domain) {
  const d = domain.toLowerCase();
  for (const c of CATEGORY_MAP) {
    for (const token of c.tokens) {
      if (d.includes(token)) return c.name;
    }
  }
  return 'Other';
}

function extractDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch (e) {
    return null;
  }
}

function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [topSites, setTopSites] = useState([]);
  const [uniqueCount, setUniqueCount] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [domainCategoryList, setDomainCategoryList] = useState([]);
  const [theme, setTheme] = useState("light");

  // NEW state for focus stats
  const [tabSwitches, setTabSwitches] = useState(0);
  const [warnings, setWarnings] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [tabTime, setTabTime] = useState(0);

  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // ---- Load tracking stats from chrome.storage.session ----
  useEffect(() => {
    if (chrome?.storage?.session) {
      chrome.storage.session.get(["tabSwitches", "distractionWarnings", "StartTime", "StopTime", "tabStartTimes", "tabStopTimes"], (res) => {
        setTabSwitches(res.tabSwitches || 0);
        setWarnings(res.distractionWarnings || 0);

        // Compute total time
        let t = 0;
        if (res.StartTime && !res.StopTime) t = Date.now() - res.StartTime;
        else if (res.StartTime && res.StopTime) t = res.StopTime - res.StartTime;
        setTotalTime(t);

        // Compute current tab time
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            const url = tabs[0].url;
            const starts = res.tabStartTimes || {};
            const stops = res.tabStopTimes || {};
            const start = starts[url];
            const stop = stops[url];
            if (start && !stop) setTabTime(Date.now() - start);
            else if (start && stop) setTabTime(stop - start);
            else setTabTime(0);
          }
        });
      });
    }
  }, []);

  // ---- Load browsing history data ----
  useEffect(() => {
    chrome.storage.local.get(["theme"], (result) => {
      if (result.theme) setTheme(result.theme);
    });

    const startTime = Date.now() - 90 * 24 * 60 * 60 * 1000;

    if (!chrome || !chrome.history) {
      console.error('chrome.history not available.');
      setLoading(false);
      return;
    }

    chrome.history.search({ text: '', startTime, maxResults: 5000 }, (results) => {
      const domainMap = new Map();
      results.forEach(item => {
        if (!item.url) return;
        const domain = extractDomain(item.url);
        if (!domain) return;
        const visits = item.visitCount || 1;
        domainMap.set(domain, (domainMap.get(domain) || 0) + visits);
      });

      const domainCategoryArr = [];
      const categoryTotals = {};
      domainMap.forEach((visits, domain) => {
        const category = categorizeDomain(domain);
        domainCategoryArr.push({ domain, category, visits });
        categoryTotals[category] = (categoryTotals[category] || 0) + visits;
      });

      const sortedDomains = Array.from(domainMap.entries())
        .map(([domain, visits]) => ({ domain, visits }))
        .sort((a, b) => b.visits - a.visits);

      setTopSites(sortedDomains.slice(0, 5));
      setUniqueCount(domainMap.size);
      setCategoryCounts(categoryTotals);
      setDomainCategoryList(domainCategoryArr);
      setLoading(false);
    });
  }, []);

  // ---- Draw pie chart ----
  useEffect(() => {
    if (!chartRef.current) return;
    const labels = Object.keys(categoryCounts);
    const data = labels.map(l => categoryCounts[l]);

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const isDark = theme === 'dark';
    const chartFontColor = isDark ? '#e0e0e0' : '#666';

    chartInstanceRef.current = new Chart(chartRef.current, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          label: 'Visits by category',
          data,
          backgroundColor: isDark 
            ? ['#7b3f00', '#004225', '#00008b', '#4b0082', '#800000', '#5e4334', '#282828']
            : ['#ffc107', '#28a745', '#007bff', '#6f42c1', '#dc3545', '#6c757d', '#f8f9fa']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: chartFontColor,
            }
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) chartInstanceRef.current.destroy();
    };
  }, [categoryCounts, theme]);

  // Helper for formatting time
  const formatTime = (ms) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  return (
    <div className={`stats-container ${theme}`}>
      <h1>Statistics</h1>
      {loading ? <p>Loading history…</p> : (
        <>
          {/* New Focus Summary Section} */
          /*<div className="card focus-summary">
            <h3>Focus Tracking Summary</h3>
            <div className="focus-grid">
              <p><strong>Tab Switches:</strong> {tabSwitches}</p>
              <p><strong>Distraction Warnings:</strong> {warnings}</p>
              <p><strong>Total Time:</strong> {formatTime(totalTime)}</p>
              <p><strong>Current Tab Time:</strong> {formatTime(tabTime)}</p>
            </div>
          </div>

          <div className="summary">
            <div className="card">
              <h3>Most visited</h3>
              <ol>
                {topSites.map(s => <li key={s.domain}>{s.domain} — {s.visits} visits</li>)}
              </ol>
            </div>

            <div className="card unique-site-card">
              <h3>Unique sites</h3>
              <div className="sitecount">
                <p>{uniqueCount}</p>
              </div>
            </div>
          </div>

          <div className="chart-card card">
            <h3>Visits by Category</h3>
            <div className="chart-wrapper">
              <canvas ref={chartRef} />
            </div>
          </div>

          <div className="card">
            <h3>All Domains & Categories</h3>
            <table className="domain-table">
              <thead>
                <tr><th>Domain</th><th>Category</th><th>Visits</th></tr>
              </thead>
              <tbody>
                {domainCategoryList
                  .sort((a, b) => b.visits - a.visits)
                  .map(row => (
                    <tr key={row.domain}>
                      <td>{row.domain}</td>
                      <td>{row.category}</td>
                      <td>{row.visits}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('stats-root'));
root.render(<StatsPage />);*/

// === stats.js ===

const categories = {
  "Social Media": [
    "facebook.com", "instagram.com", "twitter.com", "tiktok.com", "linkedin.com",
    "reddit.com", "pinterest.com", "snapchat.com"
  ],
  "Video Streaming": [
    "youtube.com", "netflix.com", "hulu.com", "disneyplus.com", "twitch.tv", "primevideo.com"
  ],
  "Productivity": [
    "notion.so", "docs.google.com", "drive.google.com", "calendar.google.com",
    "asana.com", "slack.com", "trello.com", "github.com", "gitlab.com", "wikipedia.org"
  ],
  "News": [
    "bbc.com", "cnn.com", "nytimes.com", "theguardian.com", "reuters.com", "washingtonpost.com"
  ],
  "Shopping": [
    "amazon.com", "ebay.com", "walmart.com", "etsy.com", "bestbuy.com", "target.com", "temu.com"
  ],
  "Education": [
    "coursera.org", "udemy.com", "khanacademy.org", "edx.org", "mit.edu", "harvard.edu", "codeacademy.com"
  ],
  "Generative AI": [
    "openai.com", "perplexity.ai", "gemini.google.com", "anthropic.com"
  ],
  "Others": []
};

document.addEventListener("DOMContentLoaded", async () => {
  const totalSitesElem = document.getElementById("total-sites");
  const topSitesList = document.getElementById("top-sites");
  const refreshBtn = document.getElementById("refresh-btn");
  const exportBtn = document.getElementById("export-btn");
  const themeToggle = document.getElementById("theme-toggle");
  const ctx = document.getElementById("categoryChart").getContext("2d");

  let categoryChart;

  // --- Load and render stats ---
  async function loadStats() {
    const historyData = await getBrowsingData();
    const { total, topSites, categoryCount } = processData(historyData);

    totalSitesElem.textContent = total;

    // Display top 5 sites
    topSitesList.innerHTML = "";
    topSites.forEach(([site, count]) => {
      const li = document.createElement("li");
      li.textContent = `${site} - ${count} visits`;
      topSitesList.appendChild(li);
    });

    // Draw chart
    if (categoryChart) categoryChart.destroy();
    categoryChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: Object.keys(categoryCount),
        datasets: [
          {
            label: "Visits by Category",
            data: Object.values(categoryCount),
            backgroundColor: [
              "#4CAF50", "#2196F3", "#FF9800", "#E91E63",
              "#9C27B0", "#FFC107", "#607D8B", "#8BC34A"
            ]
          }
        ]
      },
      options: {
        plugins: {
          legend: { position: "bottom" }
        }
      }
    });
  }

  // --- Get browsing data from Chrome History ---
  async function getBrowsingData() {
    return new Promise((resolve) => {
      const startTime = Date.now() - 90 * 24 * 60 * 60 * 1000; // last 90 days
      chrome.history.search({ text: "", startTime, maxResults: 10000 }, (results) => {
        resolve(results);
      });
    });
  }

  // --- Process and categorize data ---
  function processData(results) {
    const siteCounts = {};

    results.forEach((item) => {
      try {
        const url = new URL(item.url);
        const domain = url.hostname.replace("www.", "");
        siteCounts[domain] = (siteCounts[domain] || 0) + 1;
      } catch (e) {}
    });

    const total = Object.keys(siteCounts).length;

    // Sort and pick top 5
    const sortedSites = Object.entries(siteCounts).sort((a, b) => b[1] - a[1]);
    const topSites = sortedSites.slice(0, 5);

    // Categorize
    const categoryCount = {};
    Object.keys(categories).forEach((cat) => (categoryCount[cat] = 0));

    for (const [site, count] of sortedSites) {
      let found = false;
      for (const [cat, list] of Object.entries(categories)) {
        if (list.some((domain) => site.includes(domain))) {
          categoryCount[cat] += count;
          found = true;
          break;
        }
      }
      if (!found) categoryCount["Others"] += count;
    }

    return { total, topSites, categoryCount };
  }

  // --- Export stats as JSON ---
  function exportData() {
    const exportObj = {
      totalSites: totalSitesElem.textContent,
      topSites: Array.from(topSitesList.children).map((li) => li.textContent)
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "focusflow_stats.json";
    a.click();
  }

  // --- Toggle light/dark mode ---
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    themeToggle.textContent = isDark ? "🌙 Dark" : "🌞 Light";
    chrome.storage.local.set({ theme: isDark ? "dark" : "light" });
  });

  // --- Load theme preference on startup ---
  chrome.storage.local.get("theme", (data) => {
    const theme = data.theme || "light";
    if (theme === "dark") document.body.classList.add("dark-mode");
    themeToggle.textContent = theme === "dark" ? "🌙 Dark" : "🌞 Light";
  });

  refreshBtn.addEventListener("click", loadStats);
  exportBtn.addEventListener("click", exportData);

  loadStats(); // initial render
});





