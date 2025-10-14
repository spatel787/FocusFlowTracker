import React, { useEffect, useState, useRef } from 'react';
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
  const [topSites, setTopSites] = useState([]); // [{domain, visits}]
  const [uniqueCount, setUniqueCount] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState({}); // {category: visits}
  const [domainCategoryList, setDomainCategoryList] = useState([]); // [{domain, category, visits}]
  const [theme, setTheme] = useState("light"); // default theme
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    // Load saved theme from storage
    chrome.storage.local.get(["theme"], (result) => {
      if (result.theme) setTheme(result.theme);
    });
    
    // Use last 90 days of history (adjust as needed)
    const startTime = Date.now() - 90 * 24 * 60 * 60 * 1000;

    if (!chrome || !chrome.history) {
      console.error('chrome.history not available.');
      setLoading(false);
      return;
    }

    chrome.history.search({ text: '', startTime, maxResults: 5000 }, (results) => {
      // results is an array of HistoryItem { id, url, title, lastVisitTime, visitCount }
      const domainMap = new Map(); // domain -> visits (sum of visitCount)
      results.forEach(item => {
        if (!item.url) return;
        const domain = extractDomain(item.url);
        if (!domain) return;
        const visits = item.visitCount || 1;
        domainMap.set(domain, (domainMap.get(domain) || 0) + visits);
      });

      // Build domain -> category list
      const domainCategoryArr = [];
      const categoryTotals = {};
      domainMap.forEach((visits, domain) => {
        const category = categorizeDomain(domain);
        domainCategoryArr.push({ domain, category, visits });
        categoryTotals[category] = (categoryTotals[category] || 0) + visits;
      });

      // Sort top sites by visits
      const sortedDomains = Array.from(domainMap.entries())
        .map(([domain, visits]) => ({ domain, visits }))
        .sort((a, b) => b.visits - a.visits);

      const top5 = sortedDomains.slice(0, 5);
      setTopSites(top5);
      setUniqueCount(domainMap.size);
      setCategoryCounts(categoryTotals);
      setDomainCategoryList(domainCategoryArr);
      setLoading(false);
    });
  }, []);

  // Draw chart whenever categoryCounts changes
  useEffect(() => {
    if (!chartRef.current) return;
    const labels = Object.keys(categoryCounts);
    const data = labels.map(l => categoryCounts[l]);

    // Destroy previous chart
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

  return (
    <div className={`stats-container ${theme}`}>
      <h1>Statistics</h1>
      {loading ? <p>Loading history…</p> : (
        <>
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

// Mount the component
const root = ReactDOM.createRoot(document.getElementById('stats-root'));
root.render(<StatsPage />);
