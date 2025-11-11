import React, { useEffect, useState, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import Chart from 'chart.js/auto';
import './stats.css';
import { time_get} from "./storage.js";

// --- HELPERS (Defined at the top level) ---

function categorizeDomain(domain, categoryMap) {
  if (!domain || !categoryMap) return 'Other';
  const d = domain.toLowerCase();

  for (const category of categoryMap) {
    if (category.tokens) {
        for (const token of category.tokens) {
            if (d.includes(token)) {
                return category.name;
            }
        }
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

function getFaviconUrl(domain) {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=https://${domain}/&size=16`;
    }
    return `https://www.google.com/s2/favicons?domain=${domain}`;
}

const TOP_SITES_LIMIT = 10;

function processHistoryResults(results, categoryMap) {
    const domainMap = new Map();
    let totalVisits = 0;

    results.forEach(item => {
        if (!item.url || !item.visitCount) return;
        
        const domain = extractDomain(item.url);
        if (!domain) return;
        const visits = item.visitCount || 1;
        totalVisits += visits;

        const existing = domainMap.get(domain) || { visits: 0 };
        domainMap.set(domain, { visits: existing.visits + visits });
    });

    const domainCategoryArr = [];
    const categoryTotals = {};
    const allDomainsWithData = [];

    domainMap.forEach((data, domain) => {
        const visits = data.visits;
        const category = categorizeDomain(domain, categoryMap);
        
        domainCategoryArr.push({ domain, category, visits });
        categoryTotals[category] = (categoryTotals[category] || 0) + visits;

        allDomainsWithData.push({ 
            domain, 
            visits,
            faviconUrl: getFaviconUrl(domain)
        });
    });

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
    };
}



// --- REACT COMPONENTS ---


function SiteListItem({ site, mode, websiteStats }) {
    const [imgSrc, setImgSrc] = useState(site.faviconUrl);
    const fallbackIcon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDIQIDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWdsb2JlIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxwYXRoIGQ9Ik0xMiAyYy00LjcgMi41LTcgOC03IDh2MGMwIDQuNyAyLjUgNyA4IDd2MGM1LjUtMi4yIDgtOC41IDgtOHYwYzAtMi43LTIuNS03LTgtN3oiLz48cGF0aCBkPSJNOSAyMi42TDEyIDE5bDMtMy42Ii8+PC9zdmc+';
    
    const handleImageError = () => {
        if (imgSrc !== fallbackIcon) setImgSrc(fallbackIcon);
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
                (<DisplayTime site={site.domain} websiteStats={websiteStats} /> spent)
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
    const [categoryMap, setCategoryMap] = useState(null);
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
    const [mode, setMode] = useState(() => localStorage.getItem('mode') || 'light');
    const [time, setTime] = useState(0);
    
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    // --- Data Fetching and Initialization ---
    useEffect(() => {
        const initialize = async () => {
            setLoading(true);

            // Promise to fetch website stats
            const statsPromise = new Promise(resolve => {
                if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
                    resolve({});
                    return;
                }
                chrome.runtime.sendMessage({ type: 'GET_WEBSITE_STATS' }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('Error fetching website stats:', chrome.runtime.lastError.message);
                        resolve({});
                    } else {
                        resolve(response?.websiteStats || {});
                    }
                });
            });

            // Promise to fetch the category map
            const mapPromise = (async () => {
                const url = chrome.runtime.getURL('sites.json');
                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to load sites.json');
                const sitesData = await response.json();

                let finalMap;
                if (Array.isArray(sitesData)) {
                    finalMap = sitesData;
                } else {
                    const sitesByCategory = {};
                    for (const [domain, category] of Object.entries(sitesData)) {
                        if (!sitesByCategory[category]) sitesByCategory[category] = [];
                        sitesByCategory[category].push(domain);
                    }
                    finalMap = Object.entries(sitesByCategory).map(([name, tokens]) => ({ name, tokens }));
                }
                if (!finalMap.some(cat => cat.name === 'Other')) {
                    finalMap.push({ name: 'Other', tokens: [] });
                }
                return finalMap;
            })();

            // Run all promises concurrently
            try {
                const [stats, map] = await Promise.all([statsPromise, mapPromise]);
                setWebsiteStats(stats);
                setCategoryMap(map); // This triggers the next useEffect
            } catch (error) {
                console.error("Initialization failed:", error);
                setCategoryMap([{ name: 'Other', tokens: [] }]); // Fallback
            }
        };

        initialize();
        time_get().then(setTime);
    }, []);

    // This effect runs AFTER the categoryMap is successfully loaded
    useEffect(() => {
        if (!categoryMap) return; // Don't run if the map isn't ready

        const fetchHistory = () => {
            const startTime = Date.now() - 90 * 24 * 60 * 60 * 1000;
            if (!chrome || !chrome.history) {
                console.error('chrome.history not available.');
                setLoading(false);
                return;
            }
            chrome.history.search({ text: '', startTime, maxResults: 5000 }, (results) => {
                const data = processHistoryResults(results, categoryMap);
                setUniqueCount(data.uniqueCount);
                setCategoryCounts(data.categoryTotals);
                setDomainCategoryList(data.domainCategoryList);
                setTopSitesData(data.allDomainsWithData);
                setTotalVisits(data.totalVisits);
                setLoading(false); // End loading only after all data is processed
            });
        };

        fetchHistory();
    }, [categoryMap]); // Dependency: This runs only when categoryMap changes

    // --- UI Logic ---
    useEffect(() => {
        document.body.className = mode === 'dark' ? 'dark-mode' : '';
    }, [mode]);


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
        setMode(prev => {
            const newMode = prev === 'light' ? 'dark' : 'light';
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
            setSortOrder('desc');
        }
    };
    
    const sortedTopSites = useMemo(() => {
        return [...topSitesData]
            .sort((a, b) => {
                const comparison = sortBy === 'visits' ? a.visits - b.visits : a.domain.localeCompare(b.domain);
                return sortOrder === 'asc' ? comparison : -comparison;
            })
            .slice(0, TOP_SITES_LIMIT);
    }, [topSitesData, sortBy, sortOrder]);

    const filteredDomainList = useMemo(() => {
        return [...domainCategoryList]
            .filter(d => selectedCategory === 'All' || d.category === selectedCategory)
            .sort((a, b) => b.visits - a.visits);
    }, [domainCategoryList, selectedCategory]);

    const exportData = (format) => { /* ... export logic ... */ };

    useEffect(() => { // Chart drawing logic
        if (!chartRef.current || Object.keys(categoryCounts).length === 0) return;
        if (chartInstanceRef.current) chartInstanceRef.current.destroy();

        const labels = Object.keys(categoryCounts);
        const data = labels.map(l => categoryCounts[l]);
        const backgroundColors = ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff', '#ff9f40', '#c9cbcf'];

        chartInstanceRef.current = new Chart(chartRef.current, {
            type: 'pie',
            data: { labels, datasets: [{ data, backgroundColor: backgroundColors, borderColor: mode === 'dark' ? '#374151' : '#fff' }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: mode === 'dark' ? '#f3f4f6' : '#111827' } } } }
        });
        return () => chartInstanceRef.current?.destroy();
    }, [categoryCounts, mode]);

    // --- JSX Render ---
    return (
        <div className="stats-container">
            <div className="header-bar">
                <h1 className="header-title">Your Recent Browsing Stats (Last 90 Days)</h1>
                {!loading && (
                    <div className="metric-and-control-group">
                        <div className="metric-chip">Domains: <span>{uniqueCount}</span></div>
                        <div className="metric-chip">Visits: <span>{totalVisits.toLocaleString()}</span></div>
                        <div className="metric-chip">Time: <span>{formatTime(time)}</span></div>
                        <div className="control-group">
                            <button onClick={() => exportData('csv')} className="control-btn">⬇️ Export</button>
                            <button onClick={() => window.location.reload()} className="control-btn">🔄 Refresh</button>
                            <button onClick={toggleMode} className="mode-toggle">{mode === 'light' ? '🌙' : '☀️'}</button>
                        </div>
                    </div>
                )}
            </div>

            {loading ? <p className="text-center-note">Loading stats...</p> : (
                <>
                    <div className="summary main-content-row">
                        <div className="card top-sites-card">
                            <h3>Top {TOP_SITES_LIMIT} Most Visited Sites</h3>
                            <div className="sort-controls">
                                <span>Sort by: </span>
                                <button onClick={() => handleSortChange('visits')} className={sortBy === 'visits' ? 'active' : ''}>
                                  Visits {sortBy === 'visits' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                                </button>
                                <button onClick={() => handleSortChange('domain')} className={sortBy === 'domain' ? 'active' : ''}>
                                  Domain {sortBy === 'domain' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                                </button>
                            </div>
                            <ol className="top-sites-list">
                                {sortedTopSites.map(s => <SiteListItem key={s.domain} site={s} mode={mode} websiteStats={websiteStats} />)}
                            </ol>
                        </div>
                        <div className="chart-card card pie-chart-card">
                            <h3>Visits by Category</h3>
                            <div className="chart-wrapper"><canvas ref={chartRef} /></div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="domain-table-header">
                            <h3>Domains by Category</h3>
                            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                                <option value="All">All Categories ({domainCategoryList.length})</option>
                                {Object.keys(categoryCounts).map(cat => <option key={cat} value={cat}>{cat} ({categoryCounts[cat]})</option>)}
                            </select>
                        </div>
                        <table className="domain-table">
                            <thead><tr><th>Domain</th><th>Category</th><th>Visits</th><th>Time Spent</th></tr></thead>
                            <tbody>
                                {filteredDomainList.map(row => (
                                    <tr key={row.domain}>
                                        <td>{row.domain}</td>
                                        <td>{row.category}</td>
                                        <td>{row.visits}</td>
                                        <td><DisplayTime site={row.domain} websiteStats={websiteStats} /></td>
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
root.render(
  <React.StrictMode>
    <StatsPage />
  </React.StrictMode>
);
