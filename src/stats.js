import React, { useEffect, useState, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import Chart from 'chart.js/auto';
import './stats.css';
import { time_get} from "./storage.js";

// --- Configuration and Helpers ---

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

// Helper to get the base URL for the favicon
function getFaviconUrl(domain) {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=https://${domain}/&size=16`;
    }
    return `https://www.google.com/s2/favicons?domain=${domain}`;
}

const TOP_SITES_LIMIT = 10;

// --- Data Processing Function ---

function processHistoryResults(results) {
    const domainMap = new Map();
    let totalVisits = 0;

    // We only need domain totals and category data for the remaining charts/tables
    results.forEach(item => {
        if (!item.url || !item.visitCount) return;
        
        const domain = extractDomain(item.url);
        if (!domain) return;
        const visits = item.visitCount || 1;
        totalVisits += visits;

        const existing = domainMap.get(domain) || { visits: 0 };
        domainMap.set(domain, { visits: existing.visits + visits });
    });

    // Build Category Totals, Domain List, and All Sites List
    const domainCategoryArr = [];
    const categoryTotals = {};
    const allDomainsWithData = [];

    domainMap.forEach((data, domain) => {
        const visits = data.visits;
        const category = categorizeDomain(domain);
        
        domainCategoryArr.push({ domain, category, visits });
        categoryTotals[category] = (categoryTotals[category] || 0) + visits;

        allDomainsWithData.push({ 
            domain, 
            visits,
            faviconUrl: getFaviconUrl(domain)
        });
    });

    // Sort category totals by count
    const sortedCategories = Object.entries(categoryTotals)
      .sort(([, visitsA], [, visitsB]) => visitsB - visitsA)
      .reduce((obj, [category, visits]) => {
        obj[category] = visits;
        return obj;
      }, {});

    return { 
        allDomainsWithData, 
        categoryTotals: sortedCategories, 
        domainCategoryList: domainCategoryArr, 
        uniqueCount: domainMap.size,
        totalVisits,
        // Removed dailyVisitCounts
    };
}


// --- Site List Item Component with Favicon Fallback ---

function SiteListItem({ site, mode, websiteStats }) {
    const [imgSrc, setImgSrc] = useState(site.faviconUrl);
    
    const fallbackIcon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWdsb2JlIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxwYXRoIGQ9Ik0xMiAyYy00LjcgMi41LTcgOC03IDh2MGMwIDQuNyAyLjUgNyA4IDd2MGM1LjUtMi4yIDgtOC41IDgtOHYwYzAtMi43LTIuNS03LTgtN3oiLz48cGF0aCBkPSJNOSAyMi42TDEyIDE5bDMtMy42Ii8+PC9zdmc+';
    
    const handleImageError = () => {
        if (imgSrc !== fallbackIcon) {
            setImgSrc(fallbackIcon);
        }
    };

    return (
        <li className="site-list-item">
            <img 
                src={imgSrc} 
                onError={handleImageError} 
                alt="icon" 
                style={{ width: '16px', height: '16px', marginRight: '8px', flexShrink: 0 }} 
            />
            <a 
                href={`https://${site.domain}`} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ flexGrow: 1, textDecoration: 'none', color: mode === 'dark' ? '#93c5fd' : '#1d4ed8' }}
            >
                {site.domain}
            </a>
            <span style={{ fontWeight: 'bold', flexShrink: 0 }}>
                ({site.visits} visits)

                ({<DisplayTime site={site.domain} websiteStats={websiteStats} />} time spent)
            </span>
        </li>
    );
}

/*
function DisplayTime({site}) {
  let now = 0;
  chrome.storage.local.get(["tabStartTimes", "tabStopTimes"], (res) => {
    if (res) {
        const starts = res.tabStartTimes || {};
        const stops = res.tabStopTimes || {};
        if (stops[site]) {
          now = stops[site] - starts[site];
        }
    }
  });
  if (now == 0) {
    return ("Unknown")
  }
  else {
    return (formatTime(now))
  }
}
*/

// NEW: Function to get and display website time from your tracking feature
function DisplayTime({ site, websiteStats }) {
  // FIX: Better handling of empty or missing stats
  if (!websiteStats || Object.keys(websiteStats).length === 0) {
    return "0s";
  }
  
  if (!websiteStats[site]) {
    return "0s";
  }
  
  const totalSeconds = websiteStats[site];
  return formatTimeFromSeconds(totalSeconds);
}

// NEW: Format seconds to readable time (different from the existing formatTime which uses milliseconds)
function formatTimeFromSeconds(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  if (h > 0) {
    return `${h}h ${m}m`;
  } else if (m > 0) {
    return `${m}m ${s}s`;
  } else {
    return `${s}s`;
  }
}

const formatTime = (ms) => {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// --- Main App Component ---

function StatsPage() {
    // --- State Management ---
    const [loading, setLoading] = useState(true);
    const [uniqueCount, setUniqueCount] = useState(0);
    const [totalVisits, setTotalVisits] = useState(0);
    const [categoryCounts, setCategoryCounts] = useState({});
    const [domainCategoryList, setDomainCategoryList] = useState([]);
    const [topSitesData, setTopSitesData] = useState([]);

    // NEW: Add website time tracking stats
const [websiteStats, setWebsiteStats] = useState({});
    // Removed: dailyVisitData
    
    // UI States
    const [sortBy, setSortBy] = useState('visits');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [mode, setMode] = useState(() => {
        return localStorage.getItem('mode') === 'dark' ? 'dark' : 'light';
    });

    const [time, setTime] = useState(0);
    
    // Chart Refs
    const chartRef = useRef(null); // Pie Chart
    const chartInstanceRef = useRef(null);
    // Removed: dailyChartRef and dailyChartInstanceRef

    // --- Mode/Auth Handlers ---


    // NEW: Function to get website time tracking stats
const fetchWebsiteStats = () => {
    return new Promise((resolve) => {
        // FIX: Add chrome runtime check
        if (!chrome || !chrome.runtime) {
            console.log('❌ Chrome runtime not available');
            resolve({});
            return;
        }

        chrome.runtime.sendMessage({ type: 'GET_WEBSITE_STATS' }, (response) => {
            // FIX: Check for runtime errors
            if (chrome.runtime.lastError) {
                console.error('❌ Error fetching website stats:', chrome.runtime.lastError);
                resolve({});
                return;
            }

            if (response && response.websiteStats) {
                setWebsiteStats(response.websiteStats);
                console.log('✅ Website stats loaded:', response.websiteStats);
                resolve(response.websiteStats);
            } else {
                console.log('⚠️ No website stats available');
                setWebsiteStats({});
                resolve({});
            }
        });
    });
};

    const toggleMode = () => {
        setMode(prevMode => {
            const newMode = prevMode === 'light' ? 'dark' : 'light';
            localStorage.setItem('mode', newMode);
            return newMode;
        });
    };

    useEffect(() => {
        if (mode === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [mode]);

    // --- Data Fetching and Refresh ---
    /*
    const fetchHistory = (maxResults = 5000) => {
        setLoading(true);
        const startTime = Date.now() - 90 * 24 * 60 * 60 * 1000;

        if (!chrome || !chrome.history) {
            console.error('chrome.history not available.');
            setLoading(false);
            return;
        }

        chrome.history.search({ text: '', startTime, maxResults }, (results) => {
            const data = processHistoryResults(results);

            setUniqueCount(data.uniqueCount);
            setCategoryCounts(data.categoryTotals);
            setDomainCategoryList(data.domainCategoryList);
            setTopSitesData(data.allDomainsWithData);
            setTotalVisits(data.totalVisits);
            // Removed: setDailyVisitData
            setLoading(false);
        });
    };
    */
    const fetchHistory = (maxResults = 5000) => {
    setLoading(true);
    const startTime = Date.now() - 90 * 24 * 60 * 60 * 1000;

    if (!chrome || !chrome.history) {
        console.error('chrome.history not available.');
        setLoading(false);
        return;
    }

    // NEW: Load both history and website stats
    Promise.all([
        new Promise(resolve => {
            chrome.history.search({ text: '', startTime, maxResults }, resolve);
        }),
        fetchWebsiteStats()
    ]).then(([results, websiteStatsData]) => {
        const data = processHistoryResults(results);

        setUniqueCount(data.uniqueCount);
        setCategoryCounts(data.categoryTotals);
        setDomainCategoryList(data.domainCategoryList);
        setTopSitesData(data.allDomainsWithData);
        setTotalVisits(data.totalVisits);
        setLoading(false);
    }).catch(error => {
        console.error('Error fetching data:', error);
        setLoading(false);
    });
};
    
    
    useEffect(() => {
        fetchHistory();
        //setTime(time_get());
         time_get().then(setTime);
    }, []); 

    // --- UI/Sort/Filter Logic ---

    const handleSortChange = (newSortBy) => {
        if (sortBy === newSortBy) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(newSortBy);
            setSortOrder(newSortBy === 'visits' ? 'desc' : 'asc');
        }
    };

    // Memoized sorting and limiting of top sites
    const sortedTopSites = useMemo(() => {
        if (topSitesData.length === 0) return [];

        const sorted = [...topSitesData].sort((a, b) => {
            let comparison = 0;
            
            if (sortBy === 'visits') {
                comparison = a.visits - b.visits;
            } else if (sortBy === 'domain') {
                comparison = a.domain.localeCompare(b.domain);
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return sorted.slice(0, TOP_SITES_LIMIT);
    }, [topSitesData, sortBy, sortOrder]);

    // Memoized filtered domain list for the bottom table
    const filteredDomainList = useMemo(() => {
        let list = [...domainCategoryList];

        if (selectedCategory !== 'All') {
            list = list.filter(d => d.category === selectedCategory);
        }
        
        return list.sort((a, b) => b.visits - a.visits);

    }, [domainCategoryList, selectedCategory]);

    // --- Export Function ---
    
    const exportData = (format) => {
        const dataToExport = domainCategoryList.sort((a, b) => b.visits - a.visits);
        let content;
        let mimeType;
        let filename;

        if (format === 'csv') {
            const header = ['Domain', 'Category', 'Visits'].join(',');
            const rows = dataToExport.map(d => [d.domain, d.category, d.visits].join(','));
            content = [header, ...rows].join('\n');
            mimeType = 'text/csv';
            filename = 'browsing_stats.csv';
        } else { // JSON
            content = JSON.stringify(dataToExport, null, 2);
            mimeType = 'application/json';
            filename = 'browsing_stats.json';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };


    // --- Chart Effects ---

    // Pie Chart Effect (The only remaining chart)
    useEffect(() => {
        if (!chartRef.current || Object.keys(categoryCounts).length === 0) return;
        const labels = Object.keys(categoryCounts);
        const data = labels.map(l => categoryCounts[l]);

        const backgroundColors = [
            '#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff', '#ff9f40', '#c9cbcf'
        ];

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
            chartInstanceRef.current = null;
        }

        chartInstanceRef.current = new Chart(chartRef.current, {
            type: 'pie',
            data: {
                labels,
                datasets: [{
                    label: 'Visits by category',
                    data,
                    backgroundColor: backgroundColors.slice(0, labels.length),
                    borderColor: mode === 'dark' ? '#374151' : '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: mode === 'dark' ? '#f3f4f6' : '#111827',
                            padding: 15
                        }
                    }
                }
            }
        });

        return () => {
            if (chartInstanceRef.current) chartInstanceRef.current.destroy();
        };
    }, [categoryCounts, mode]);

    // --- JSX Render ---
    return (
        <div className="stats-container">
            {/* Header Bar: Compacted Title, Metrics, and Controls */}
            <div className="header-bar">
                <h1 className="header-title">Your Recent Browsing Stats (Last 90 Days)</h1>

                {loading ? <p>Loading...</p> : (
                    <div className="metric-and-control-group">
                        {/* Metrics */}
                        <div className="metric-chip">
                            <span className="metric-label">Domains:</span>
                            <span className="metric-value">{uniqueCount}</span>
                        </div>
                        <div className="metric-chip">
                            <span className="metric-label">Visits:</span>
                            <span className="metric-value">{totalVisits.toLocaleString()}</span>
                        </div>
                        <div className="metric-chip">
                            <span className="metric-label">Time:</span>
                            <span className="metric-value">{formatTime(time)}</span>
                        </div>

                        {/* Control Buttons Group */}
                        <div className="control-group">
                            <button onClick={() => exportData('csv')} className="control-btn export-btn">
                                ⬇️ Export
                            </button>
                            <button onClick={() => fetchHistory()} className="control-btn refresh-btn">
                                🔄 Refresh
                            </button>
                            <button onClick={toggleMode} className="mode-toggle">
                                {mode === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {loading ? <p className="text-center-note">Loading history...</p> : (
                <>
                    {/* The large-chart-card section has been removed! */}

                    {/* Top Sites & Category Pie Chart - Side-by-Side (Moves up to fill the gap) */}
                    <div className="summary main-content-row">
                        <div className="card top-sites-card">
                            <h3>Top {TOP_SITES_LIMIT} Most Visited Sites</h3>
                            
                            <div className="sort-controls">
                                <span>Sort by: </span>
                                <button 
                                  onClick={() => handleSortChange('visits')} 
                                  className={sortBy === 'visits' ? 'active' : ''}
                                >
                                  Visits {sortBy === 'visits' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                                </button>
                                <button 
                                  onClick={() => handleSortChange('domain')}
                                  className={sortBy === 'domain' ? 'active' : ''}
                                >
                                  Domain {sortBy === 'domain' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                                </button>
                            </div>

                            <ol className="top-sites-list">
                                {sortedTopSites.map(s => (
                                    <SiteListItem key={s.domain} site={s} mode={mode} websiteStats={websiteStats} />
                                ))}
                            </ol>
                            {sortedTopSites.length === 0 && <p className="text-center-note">No sites found in history.</p>}
                        </div>

                        <div className="chart-card card pie-chart-card">
                            <h3>Visits by Category</h3>
                            <div className="chart-wrapper">
                                <canvas ref={chartRef} />
                            </div>
                        </div>
                    </div>

                    {/* All Domains Table with Filter */}
                    <div className="card">
                        <div className="domain-table-header">
                            <h3>Domains by Category</h3>
                            <div className="filter-control">
                                <label htmlFor="category-filter">Filter:</label>
                                <select 
                                    id="category-filter"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className={mode === 'dark' ? 'dark-select' : ''}
                                >
                                    <option value="All">All Categories ({domainCategoryList.length})</option>
                                    {Object.keys(categoryCounts).map(category => (
                                        <option key={category} value={category}>
                                            {category} ({categoryCounts[category].toLocaleString()})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        <table className="domain-table">
                            <thead>
                                <tr><th>Domain</th><th>Category</th><th>Visits</th><th>Time Spent</th></tr>
                            </thead>
                            <tbody>
                                {filteredDomainList
                                    .map(row => (
                                        <tr key={row.domain}>
                                            <td>{row.domain}</td>
                                            <td>{row.category}</td>
                                            <td>{row.visits}</td>
                                            <td><DisplayTime site={row.domain} websiteStats={websiteStats} /></td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                        
                        {filteredDomainList.length === 0 && (
                            <p className="text-center-note">
                                No sites found in the selected category.
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

// Mount the component
const root = ReactDOM.createRoot(document.getElementById('stats-root'));
root.render(
  <React.StrictMode>
    <StatsPage />
  </React.StrictMode>
);