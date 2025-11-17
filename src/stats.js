import React, { useEffect, useState, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import Chart from 'chart.js/auto';
import './stats.css';

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

const TOP_SITES_LIMIT = 10;

function processHistoryResults(results, categoryMap) {
    // Get your extension's own ID
    const myId = (chrome && chrome.runtime) ? chrome.runtime.id : null;
    
    const domainMap = new Map();
    let totalVisits = 0;

    results.forEach(item => {
        if (!item.url || !item.visitCount) return;
        
        const domain = extractDomain(item.url);

        // Skip this item if it's your own extension
        if (!domain || domain === myId) {
            return; 
        }

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
            visits
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


function SiteListItem({ site, mode }) { 
    return (
        <li className="site-list-item">
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
            </span>
        </li>
    );
}

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
    
    // UI States
    const [sortBy, setSortBy] = useState('visits');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [mode, setMode] = useState(() => localStorage.getItem('mode') || 'light');
    
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    // --- Data Fetching and Initialization ---
    useEffect(() => {
        const initialize = async () => {
            setLoading(true);

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

            try {
                const map = await mapPromise;
                setCategoryMap(map); // This triggers the next useEffect
            } catch (error) {
                console.error("Initialization failed:", error);
                setCategoryMap([{ name: 'Other', tokens: [] }]); // Fallback
            }
        };

        initialize();
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

    const toggleMode = () => {
        setMode(prev => {
            const newMode = prev === 'light' ? 'dark' : 'light';
            localStorage.setItem('mode', newMode);
            return newMode;
        });
    };

    // --- Data Fetching and Refresh ---
    const fetchHistory = (maxResults = 5000) => {
        setLoading(true);
        const startTime = Date.now() - 90 * 24 * 60 * 60 * 1000;

        if (!chrome || !chrome.history) {
            console.error('chrome.history not available.');
            setLoading(false);
            return;
        }

        new Promise(resolve => {
            chrome.history.search({ text: '', startTime, maxResults }, resolve);
        }).then((results) => {
            if (!categoryMap) { // Guard against race condition
                setLoading(false);
                return; 
            }
            const data = processHistoryResults(results, categoryMap);

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

    
    // --- THIS IS THE NEW "FULL PAGE" EXPORT FUNCTION ---
    const exportData = (format) => {
        if (format !== 'csv' || loading) {
            console.warn("No data to export or still loading.");
            return;
        }

        // Helper function to escape commas in CSV fields
        const csvSafe = (str) => `"${String(str).replace(/"/g, '""')}"`;

        let csvContent = "";

        // --- Section 1: Summary Stats ---
        csvContent += "Summary Stats\n";
        csvContent += "Metric,Value\n";
        csvContent += `Total Unique Domains,${uniqueCount}\n`;
        csvContent += `Total Visits,${totalVisits.toLocaleString()}\n`;
        csvContent += "\n"; // Add a blank line for spacing

        // --- Section 2: Visits by Category (Pie Chart Data) ---
        csvContent += "Visits by Category\n";
        csvContent += "Category,Visits,Percentage\n";
        const totalCategoryVisits = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
        
        Object.entries(categoryCounts).forEach(([category, visits]) => {
            const percentage = totalCategoryVisits > 0 ? ((visits / totalCategoryVisits) * 100).toFixed(1) : 0;
            csvContent += `${csvSafe(category)},${visits},${percentage}%\n`;
        });
        csvContent += "\n";

        // --- Section 3: Top 10 Most Visited Sites ---
        csvContent += "Top 10 Most Visited Sites\n";
        csvContent += "Rank,Domain,Visits\n";
        sortedTopSites.forEach((site, index) => {
            csvContent += `${index + 1},${csvSafe(site.domain)},${site.visits}\n`;
        });
        csvContent += "\n";

        // --- Section 4: Full Domain List ---
        csvContent += "Full Domain List\n";
        csvContent += "Domain,Category,Visits\n";
        // Sort the full list by visits for the export
        const sortedFullList = [...domainCategoryList].sort((a, b) => b.visits - a.visits);
        sortedFullList.forEach(row => {
            csvContent += `${csvSafe(row.domain)},${csvSafe(row.category)},${row.visits}\n`;
        });

        // --- Create and trigger download link ---
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        
        link.setAttribute("href", url);
        link.setAttribute("download", "FocusFlow_Stats_Report.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        
        link.click(); // Download the data
        
        document.body.removeChild(link); // Clean up
    };


    useEffect(() => { // Chart drawing logic
        if (!chartRef.current || Object.keys(categoryCounts).length === 0) return;
        if (chartInstanceRef.current) chartInstanceRef.current.destroy();

        const labelNames = Object.keys(categoryCounts);
        const data = labelNames.map(l => categoryCounts[l]);
        const total = data.reduce((acc, val) => acc + val, 0);

        const formattedLabels = labelNames.map((label, index) => {
            const value = data[index];
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label} (${percentage}%)`;
        });

        const backgroundColors = ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff', '#ff9f40', '#c9cbcf'];

        chartInstanceRef.current = new Chart(chartRef.current, {
            type: 'pie',
            data: { 
                labels: formattedLabels, 
                datasets: [{ data, backgroundColor: backgroundColors, borderColor: mode === 'dark' ? '#374151' : '#fff' }] 
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { 
                        position: 'right', 
                        labels: { 
                            color: mode === 'dark' ? '#f3f4f6' : '#111827' 
                        } 
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw || 0;
                                return `${context.label}: ${value} visits`;
                            }
                        }
                    }
                } 
            }
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
                        
                        <button onClick={() => exportData('csv')} className="control-btn">Export</button>
                        <button onClick={() => window.location.reload()} className="control-btn">Refresh</button>
                        <button onClick={toggleMode} className="mode-toggle">
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2.5" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="5" />
                              <line x1="12" y1="1" x2="12" y2="3" />
                              <line x1="12" y1="21" x2="12" y2="23" />
                              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                              <line x1="1" y1="12" x2="3" y2="12" />
                              <line x1="21" y1="12" x2="23" y2="12" />
                              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </svg>
                        </button>
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
                                {sortedTopSites.map(s => <SiteListItem key={s.domain} site={s} mode={mode} />)}
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
                            <thead><tr><th>Domain</th><th>Category</th><th>Visits</th></tr></thead>
                            <tbody>
                                {filteredDomainList.map(row => (
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
root.render(
  <React.StrictMode>
    <StatsPage />
  </React.StrictMode>
);