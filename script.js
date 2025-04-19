// DOM Elements
const fromCurrencySelect = document.querySelector('.from-currency select');
const toCurrencySelect = document.querySelector('.to-currency select');
const fromAmountInput = document.querySelector('.from-currency input');
const toAmountInput = document.querySelector('.to-currency input');
const rateDisplay = document.querySelector('.rate-info p:first-child');
const lastUpdated = document.querySelector('.time');

// Supported cryptocurrencies
const cryptocurrencies = [
    { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin' },
    { id: 'ethereum', symbol: 'eth', name: 'Ethereum' },
    { id: 'tether', symbol: 'usdt', name: 'Tether' },
    { id: 'ripple', symbol: 'xrp', name: 'XRP' },
    { id: 'cardano', symbol: 'ada', name: 'Cardano' }
];

// Initialize dropdowns
function initializeDropdowns() {
    cryptocurrencies.forEach(crypto => {
        const option1 = document.createElement('option');
        option1.value = crypto.id;
        option1.textContent = `${crypto.name} (${crypto.symbol.toUpperCase()})`;
        
        const option2 = option1.cloneNode(true);
        
        fromCurrencySelect.appendChild(option1);
        toCurrencySelect.appendChild(option2);
    });
    
    // Set default pair
    fromCurrencySelect.value = 'bitcoin';
    toCurrencySelect.value = 'ethereum';
}

// Fetch exchange rates
async function fetchExchangeRate(fromCrypto, toCrypto) {
    try {
        const fromResponse = await axios.get(
            `https://api.coingecko.com/api/v3/simple/price?ids=${fromCrypto}&vs_currencies=usd`
        );
        
        const toResponse = await axios.get(
            `https://api.coingecko.com/api/v3/simple/price?ids=${toCrypto}&vs_currencies=usd`
        );
        
        const fromPrice = fromResponse.data[fromCrypto].usd;
        const toPrice = toResponse.data[toCrypto].usd;
        
        return toPrice / fromPrice; // Calculate exchange rate
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
}

// Update displayed rate
async function updateRate() {
    const fromCrypto = fromCurrencySelect.value;
    const toCrypto = toCurrencySelect.value;
    
    const rate = await fetchExchangeRate(fromCrypto, toCrypto);
    if (rate) {
        const fromSymbol = cryptocurrencies.find(c => c.id === fromCrypto).symbol.toUpperCase();
        const toSymbol = cryptocurrencies.find(c => c.id === toCrypto).symbol.toUpperCase();
        
        rateDisplay.textContent = `1 ${fromSymbol} ≈ ${rate.toFixed(6)} ${toSymbol}`;
        lastUpdated.textContent = new Date().toLocaleTimeString();
        
        // Auto-calculate if from amount has value
        if (fromAmountInput.value) {
            toAmountInput.value = (fromAmountInput.value * rate).toFixed(6);
        }
    }
}

// Initialize and set up event listeners
function init() {
    initializeDropdowns();
    
    // Set up event listeners
    fromCurrencySelect.addEventListener('change', updateRate);
    toCurrencySelect.addEventListener('change', updateRate);
    fromAmountInput.addEventListener('input', updateRate);
    
    // Initial update
    updateRate();
    
    // Update every minute
    setInterval(updateRate, 60000);
}

// Start the app
document.addEventListener('DOMContentLoaded', init);

// Fetch top cryptocurrencies
async function fetchTopCryptos() {
    try {
        const response = await axios.get(
            'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=5&page=1&sparkline=false'
        );
        
        return response.data;
    } catch (error) {
        console.error("Error fetching market data:", error);
        return null;
    }
}

// Update market data table
async function updateMarketData() {
    const cryptos = await fetchTopCryptos();
    if (!cryptos) return;
    
    const tableBody = document.getElementById('crypto-table-body');
    tableBody.innerHTML = '';
    
    cryptos.forEach(crypto => {
        const row = document.createElement('tr');
        
        const changeClass = crypto.price_change_percentage_24h >= 0 ? 'positive' : 'negative';
        const changeIcon = crypto.price_change_percentage_24h >= 0 ? '▲' : '▼';
        
        row.innerHTML = `
            <td><img src="${crypto.image}" alt="${crypto.name}" width="20"> ${crypto.name}</td>
            <td>$${crypto.current_price.toLocaleString()}</td>
            <td class="${changeClass}">${changeIcon} ${Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
}

// Add to your init() function:
function init() {
    initializeDropdowns();
    updateRate();
    updateMarketData();
    
    // Set up intervals
    setInterval(updateRate, 60000);
    setInterval(updateMarketData, 60000);
}

let priceChart;

async function createPriceChart(cryptoId = 'bitcoin', days = 7) {
    try {
        const response = await axios.get(
            `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=usd&days=${days}`
        );
        
        const prices = response.data.prices;
        const labels = prices.map(entry => new Date(entry[0]).toLocaleDateString());
        const data = prices.map(entry => entry[1]);
        
        const ctx = document.getElementById('priceChart').getContext('2d');
        
        if (priceChart) {
            priceChart.destroy();
        }
        
        priceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${cryptocurrencies.find(c => c.id === cryptoId).name} Price (USD)`,
                    data: data,
                    borderColor: '#2962ff',
                    tension: 0.1,
                    fill: true,
                    backgroundColor: 'rgba(41, 98, 255, 0.1)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `$${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error fetching chart data:", error);
    }
}

// Add to your init() function:
function init() {
    initializeDropdowns();
    updateRate();
    updateMarketData();
    createPriceChart();
    
    // Set up intervals
    setInterval(updateRate, 60000);
    setInterval(updateMarketData, 60000);
}

// DOM Elements
const appContainer = document.getElementById('app-container');
const navLinks = {
    about: document.getElementById('nav-about'),
    rates: document.getElementById('nav-rates'),
    exchange: document.getElementById('nav-exchange')
};

// Sections Data
const sections = {
    about: {
        title: "About BlockSecure",
        html: `
            <section class="about-section section-active">
                <div class="about-header">
                    <h1>Welcome to BlockSecure</h1>
                    <p>The fastest and most secure way to exchange cryptocurrencies</p>
                </div>
                
                <div class="feature-grid">
                    <div class="feature-card">
                        <div class="feature-icon">
                            <i class="fas fa-bolt"></i>
                        </div>
                        <h3>Instant Exchanges</h3>
                        <p>Swap between 100+ cryptocurrencies in seconds with our lightning-fast technology.</p>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon">
                            <i class="fas fa-lock"></i>
                        </div>
                        <h3>Secure Transactions</h3>
                        <p>Military-grade encryption ensures your assets are always protected.</p>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon">
                            <i class="fas fa-percentage"></i>
                        </div>
                        <h3>Low Fees</h3>
                        <p>Enjoy industry-low 0.1% trading fees with no hidden charges.</p>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <h3>Real-Time Rates</h3>
                        <p>Always get the best prices with our live market data integration.</p>
                    </div>
                </div>
            </section>
        `
    },
    rates: {
        title: "Market Rates | BlockSecure",
        html: `
            <section class="market-data section-active">
                <h2>Current Market Rates <small>(Updated: <span id="last-updated">Loading...</span>)</small></h2>
                
                <div class="tables-container">
                    <table class="crypto-table" id="top-cryptos">
                        <thead>
                            <tr>
                                <th>Coin</th>
                                <th>Price</th>
                                <th>24h Change</th>
                            </tr>
                        </thead>
                        <tbody id="crypto-table-body">
                            <!-- Will be populated by JavaScript -->
                        </tbody>
                    </table>
                </div>
                
                <div class="chart-container">
                    <canvas id="priceChart"></canvas>
                </div>
            </section>
        `,
        init: initRatesSection
    },
    exchange: {
        title: "Exchange | BlockSecure",
        html: `
            <section class="exchange-container section-active">
                <div class="exchange-form">
                    <h1>Instant Cryptocurrency Exchange</h1>
                    <p>Swap between 100+ cryptocurrencies instantly</p>
                    
                    <div class="swap-box">
                        <!-- Your existing exchange form HTML -->
                        ${document.querySelector('.exchange-form')?.innerHTML || ''}
                    </div>
                </div>
            </section>
        `,
        init: initExchangeSection
    }
};

// Router Function
function navigateTo(section) {
    // Update page title
    document.title = sections[section].title;
    
    // Update active nav link
    Object.values(navLinks).forEach(link => link.classList.remove('active'));
    navLinks[section].classList.add('active');
    
    // Load section content
    appContainer.innerHTML = sections[section].html;
    
    // Initialize section if needed
    if (sections[section].init) {
        sections[section].init();
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Initialize sections
function initRatesSection() {
    // Your rates section initialization code
    updateMarketData();
    createPriceChart();
    setInterval(updateMarketData, 60000);
}

function initExchangeSection() {
    // Your exchange section initialization code
    initializeDropdowns();
    updateRate();
    setInterval(updateRate, 60000);
}

// Event Listeners
navLinks.about.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('about');
});

navLinks.rates.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('rates');
});

navLinks.exchange.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('exchange');
});

// Initialize the app (default to About page)
document.addEventListener('DOMContentLoaded', () => {
    navigateTo('about');
    
    // Keep your existing initialization code for other functionality
    initializeDropdowns();
    updateRate();
    updateMarketData();
    createPriceChart();
    
    // Set up intervals
    setInterval(updateRate, 60000);
    setInterval(updateMarketData, 60000);
});