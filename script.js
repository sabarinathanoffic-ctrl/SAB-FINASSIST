/* ============================================
   FINANCE DASHBOARD - ENHANCED JAVASCRIPT
   Real-time Google Sheets integration with advanced features
   ============================================ */

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    // Replace this with your Google Apps Script Web App URL
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxEuAMr5AXyaVUpE1mQVPbaH0s_E6GyIfayZFuMpCj8gz6acabk-eEvOnZ_CViie-MC-g/exec',
    REFRESH_INTERVAL: 60000, // 60 seconds
    CHART_MONTHS: 6 // Number of months to display in chart
};

// ============================================
// STATE MANAGEMENT
// ============================================
const state = {
    transactions: [],
    cards: [],
    filteredTransactions: [],
    activeFilters: {
        dateRange: null,
        transferredTo: null,
        type: null,
        account: [],
        category: [],
        description: '',
        amountMin: null,
        amountMax: null
    },
    currentPage: 'dashboard',
    selectedRecipient: null,
    refreshTimer: null,
    isLoading: false,
    isLoggedIn: false,
    currentUser: null
};


// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    initTheme();
});

async function initializeApp() {
    console.log('🚀 Initializing Enhanced Finance Dashboard...');

    // First check authentication
    checkAuth();

    // Set up event listeners
    setupEventListeners();

    // Set default date to today
    const dateInput = document.getElementById('transactionDate');
    if (dateInput) {
        const now = new Date();
        const dateTimeString = now.toISOString().slice(0, 16);
        dateInput.value = dateTimeString;
    }

    // Only load data if logged in
    if (state.isLoggedIn) {
        // We call hideLoadingOverlay after a small delay to ensure the login screen 
        // doesn't "flicker" if data loads fast, but before it gets stuck.
        setTimeout(hideLoadingOverlay, 5000);

        await loadDashboardData();
        startAutoRefresh();
        showPage('dashboard');
    }

    // Final safety hide
    hideLoadingOverlay();

    // Initialize UI components
    initAnalytics();
    setupAIAdvisor();

    console.log('✅ Dashboard initialization logic ready');
}



// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadDashboardData();
        });
    }

    // Add transaction button
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', () => {
            openModal('addTransactionModal');
        });
    }

    // Add card button
    const addCardBtn = document.getElementById('addCardBtn');
    if (addCardBtn) {
        addCardBtn.addEventListener('click', () => {
            openModal('addCardModal');
        });
    }

    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) closeModal(modal.id);
        });
    });

    document.querySelectorAll('[id$="CancelBtn"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) closeModal(modal.id);
        });
    });

    // Form submissions
    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        transactionForm.addEventListener('submit', handleTransactionSubmit);
    }

    const cardForm = document.getElementById('cardForm');
    if (cardForm) {
        cardForm.addEventListener('submit', handleCardSubmit);
    }

    // Close modal on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // Navigation items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            if (page) {
                showPage(page);
            }
        });
    });

    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            const theme = themeToggle.checked ? 'dark' : 'light';
            setTheme(theme);
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }

    // Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Password Reset
    const passwordResetForm = document.getElementById('passwordResetForm');
    if (passwordResetForm) {
        passwordResetForm.addEventListener('submit', handlePasswordReset);
    }

    // Filter inputs on transactions page
    setupFilterListeners();
}


function setupFilterListeners() {
    const filterInputs = [
        'filterType',
        'filterAccount',
        'filterCategory',
        'filterDescription',
        'filterAmountMin',
        'filterAmountMax',
        'filterDateStart',
        'filterDateEnd',
        'filterTransferredTo'
    ];

    filterInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', applyFilters);
            if (element.tagName === 'INPUT') {
                element.addEventListener('input', debounce(applyFilters, 300));
            }
        }
    });

    const clearFiltersBtn = document.getElementById('clearFilters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }
}

// ============================================
// DATA LOADING
// ============================================
async function loadDashboardData() {
    if (state.isLoading) return;

    state.isLoading = true;
    showLoadingState();
    console.log('📡 Fetching data from:', CONFIG.GOOGLE_SCRIPT_URL);

    try {
        const data = await fetchData();

        if (data && data.success && data.transactions && data.cards) {
            console.log('✅ Data fetched successfully:', data);
            state.transactions = data.transactions;
            state.cards = data.cards;
            state.filteredTransactions = [...state.transactions];

            // Update all UI components
            updateAllUI();
        } else {
            const errorMsg = data && data.error ? data.error : 'Invalid data format received';
            console.warn('⚠️ Google Sheets data not available:', errorMsg);

            if (CONFIG.GOOGLE_SCRIPT_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
                hideLoadingOverlay(); // Ensure user can see the alert
                showError(`Data sync failed: ${errorMsg}. Using demo data instead.`);
            }
            loadDemoData();
        }
    } catch (error) {
        console.error('❌ Error loading data:', error);
        hideLoadingOverlay(); // Ensure user can see the alert
        if (CONFIG.GOOGLE_SCRIPT_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
            showError(`Could not connect to Google Sheets. Please ensure:
1. You deployed the script as a Web App.
2. "Who has access" is set to "Anyone".
3. You authorized the script permissions.
4. The URL ends in /exec.`);
        }
        loadDemoData();
    } finally {

        state.isLoading = false;
        hideLoadingState();
    }
}

async function fetchData() {
    if (CONFIG.GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE' || !CONFIG.GOOGLE_SCRIPT_URL) {
        return null;
    }

    const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
        method: 'GET',
        redirect: 'follow'
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

async function addTransaction(transactionData) {
    if (CONFIG.GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
        state.transactions.unshift(transactionData);
        state.filteredTransactions = [...state.transactions];
        updateAllUI();
        return { success: true };
    }

    // Using text/plain to avoid CORS preflight (OPTIONS) which Apps Script doesn't support
    const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(transactionData),
        headers: {
            'Content-Type': 'text/plain;charset=utf-8'
        },
        redirect: 'follow'
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

async function addCard(cardData) {
    cardData.action = 'addCard';

    if (CONFIG.GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
        state.cards.push(cardData);
        updateCardsDisplay();
        updateCardsPage();
        return { success: true };
    }

    const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(cardData),
        headers: {
            'Content-Type': 'text/plain;charset=utf-8'
        },
        redirect: 'follow'
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

async function deleteCard(cardName) {
    const cardData = { action: 'deleteCard', cardName: cardName };

    if (CONFIG.GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
        state.cards = state.cards.filter(c => c.cardName !== cardName);
        updateCardsDisplay();
        updateCardsPage();
        return { success: true };
    }

    const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(cardData),
        headers: {
            'Content-Type': 'text/plain;charset=utf-8'
        },
        redirect: 'follow'
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}


// ============================================
// DEMO DATA
// ============================================
function loadDemoData() {
    const today = new Date();

    state.transactions = [
        {
            dateTime: formatDateTime(new Date(today.getTime() - 1 * 60 * 60 * 1000)),
            transferredTo: 'Salary Account',
            type: 'Income',
            account: 'HDFC Savings',
            category: 'Salary',
            description: 'Monthly Salary',
            amount: 50000
        },
        {
            dateTime: formatDateTime(new Date(today.getTime() - 5 * 60 * 60 * 1000)),
            transferredTo: 'Swiggy',
            type: 'Expense',
            account: 'HDFC Credit',
            category: 'Food',
            description: 'Lunch Order',
            amount: -450
        },
        {
            dateTime: formatDateTime(new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000)),
            transferredTo: 'Amazon',
            type: 'Expense',
            account: 'SBI Debit',
            category: 'Shopping',
            description: 'Electronics',
            amount: -2500
        },
        {
            dateTime: formatDateTime(new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)),
            transferredTo: 'Reliance Energy',
            type: 'Expense',
            account: 'HDFC Savings',
            category: 'Bills',
            description: 'Electricity Bill',
            amount: -1850
        },
        {
            dateTime: formatDateTime(new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)),
            transferredTo: 'Uber',
            type: 'Expense',
            account: 'Paytm Wallet',
            category: 'Transport',
            description: 'Cab Fare',
            amount: -320
        },
        {
            dateTime: formatDateTime(new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000)),
            transferredTo: 'Freelance Client',
            type: 'Income',
            account: 'SBI Savings',
            category: 'Freelance',
            description: 'Project Payment',
            amount: 15000
        },
        {
            dateTime: formatDateTime(new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000)),
            transferredTo: 'Zomato',
            type: 'Expense',
            account: 'HDFC Credit',
            category: 'Food',
            description: 'Dinner',
            amount: -850
        },
        {
            dateTime: formatDateTime(new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)),
            transferredTo: 'Flipkart',
            type: 'Expense',
            account: 'SBI Debit',
            category: 'Shopping',
            description: 'Clothing',
            amount: -1200
        },
        {
            dateTime: formatDateTime(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)),
            transferredTo: 'Swiggy',
            type: 'Expense',
            account: 'HDFC Credit',
            category: 'Food',
            description: 'Breakfast',
            amount: -250
        },
        {
            dateTime: formatDateTime(new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000)),
            transferredTo: 'Investment Return',
            type: 'Income',
            account: 'HDFC Savings',
            category: 'Investment',
            description: 'Mutual Fund',
            amount: 5000
        }
    ];

    state.cards = [
        { cardName: 'HDFC Credit Card', cardType: 'Credit', last4Digits: '4829', initialBalance: 100000, bankName: 'HDFC Bank', color: '#667eea' },
        { cardName: 'SBI Debit Card', cardType: 'Debit', last4Digits: '7234', initialBalance: 25000, bankName: 'State Bank of India', color: '#43e97b' },
        { cardName: 'HDFC Savings', cardType: 'Savings', last4Digits: '8901', initialBalance: 50000, bankName: 'HDFC Bank', color: '#4facfe' },
        { cardName: 'Paytm Wallet', cardType: 'Wallet', last4Digits: '0000', initialBalance: 5000, bankName: 'Paytm', color: '#f093fb' }
    ];

    state.filteredTransactions = [...state.transactions];
    updateAllUI();
}

function updateAllUI() {
    updateSummaryCards();
    updateTransactionsTable();
    updateChart();
    updateRecentTransfers();
    updateCardsDisplay();
    updateCardsPage();
    updateFilterOptions();
}

// ============================================
// UI UPDATES
// ============================================
function updateSummaryCards() {
    const totalIncome = state.transactions
        .filter(t => t.type.toLowerCase() === 'income')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalExpenses = state.transactions
        .filter(t => t.type.toLowerCase() === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const currentBalance = totalIncome - totalExpenses;

    const elBal = document.getElementById('currentBalance');
    const elInc = document.getElementById('totalIncome');
    const elExp = document.getElementById('totalExpenses');

    if (elBal) elBal.textContent = formatCurrency(currentBalance);
    if (elInc) elInc.textContent = formatCurrency(totalIncome);
    if (elExp) elExp.textContent = formatCurrency(totalExpenses);


    updateChangeIndicator('balanceChange', 12.5, true);
    updateChangeIndicator('incomeChange', 8.3, true);
    updateChangeIndicator('expenseChange', 5.2, false);
}

function updateChangeIndicator(elementId, percentage, isPositive) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const sign = isPositive ? '+' : '+';
    element.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="${isPositive ? 'M6 3l4 4H2l4-4z' : 'M6 9L2 5h8l-4 4z'}"/>
        </svg>
        ${sign}${percentage.toFixed(1)}%
    `;
    element.className = `change-indicator ${isPositive ? 'positive' : 'negative'}`;
}

function updateTransactionsTable(limit = 5) {
    const tableContainer = document.getElementById('transactionsTable');
    if (!tableContainer) return;

    const transactions = state.filteredTransactions.slice(0, limit);

    if (transactions.length === 0) {
        tableContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No transactions found</p>';
        return;
    }

    tableContainer.innerHTML = transactions.map(transaction => `
        <div class="transaction-row">
            <div class="transaction-datetime">${transaction.dateTime}</div>
            <div class="transaction-to">${transaction.transferredTo}</div>
            <div class="transaction-account">${transaction.account}</div>
            <div class="transaction-category">${transaction.category}</div>
            <div class="transaction-description">${transaction.description}</div>
            <div class="transaction-amount ${transaction.type === 'Income' ? 'positive' : 'negative'}">
                ${transaction.type === 'Income' ? '+' : '-'}${formatCurrency(Math.abs(transaction.amount))}
            </div>
        </div>
    `).join('');
}

function updateRecentTransfers() {
    const container = document.getElementById('recentTransfers');
    if (!container) return;

    const recipientMap = {};
    state.transactions.forEach(t => {
        const recipient = t.transferredTo;
        if (!recipient) return;
        if (!recipientMap[recipient]) {
            recipientMap[recipient] = { name: recipient, count: 0 };
        }
        recipientMap[recipient].count++;
    });

    const topRecipients = Object.values(recipientMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

    if (topRecipients.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 1rem;">No transfers yet</p>';
        return;
    }

    const colors = ['#667eea', '#43e97b', '#f093fb', '#4facfe'];
    container.innerHTML = topRecipients.map((recipient, index) => `
        <button class="contact-btn ${state.selectedRecipient === recipient.name ? 'active' : ''}" 
                onclick="handleRecipientClick('${recipient.name.replace(/'/g, "\\'")}')">
            <div class="contact-avatar" style="background: ${colors[index % colors.length]};">
                ${recipient.name.charAt(0).toUpperCase()}
            </div>
            <span class="contact-name">${recipient.name}</span>
            <span class="contact-count">${recipient.count} txns</span>
        </button>
    `).join('');
}

function updateCardsDisplay() {
    const container = document.getElementById('cardsDisplay');
    if (!container) return;

    if (state.cards.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 1rem;">No cards added</p>';
        return;
    }

    container.innerHTML = state.cards.slice(0, 2).map(card => {
        const balance = calculateCardBalance(card.cardName);
        return `
            <div class="mini-card glass-card" style="background: linear-gradient(135deg, ${card.color} 0%, ${adjustColor(card.color, -20)} 100%);">
                <div class="mini-card-name">${card.cardName}</div>
                <div class="mini-card-balance">${formatCurrency(balance)}</div>
                <div class="mini-card-number">•••• ${card.last4Digits}</div>
            </div>
        `;
    }).join('');
}

function updateCardsPage() {
    const container = document.getElementById('cardsGrid');
    if (!container) return;

    if (state.cards.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem; grid-column: 1/-1;">No cards added.</p>';
        return;
    }

    container.innerHTML = state.cards.map(card => {
        const balance = calculateCardBalance(card.cardName);
        const transactions = state.transactions.filter(t => t.account === card.cardName);
        const spent = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const received = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + Math.abs(t.amount), 0);

        return `
            <div class="card-item glass-card">
                <div class="card-visual" style="background: linear-gradient(135deg, ${card.color} 0%, ${adjustColor(card.color, -20)} 100%);">
                    <div class="card-chip"></div>
                    <div class="card-number">•••• •••• •••• ${card.last4Digits}</div>
                    <div class="card-details">
                        <div class="card-holder"><span class="label">${card.cardType}</span><span class="value">${card.cardName}</span></div>
                        <div class="card-bank"><span class="label">Bank</span><span class="value">${card.bankName}</span></div>
                    </div>
                </div>
                <div class="card-info">
                    <div class="card-balance-info"><span class="label">Current Balance</span><span class="value">${formatCurrency(balance)}</span></div>
                    <div class="card-stats">
                        <div class="stat"><span class="label">Spent</span><span class="value negative">${formatCurrency(spent)}</span></div>
                        <div class="stat"><span class="label">Transactions</span><span class="value">${transactions.length}</span></div>
                    </div>
                    <button class="btn-delete" onclick="handleDeleteCard('${card.cardName.replace(/'/g, "\\'")}')">Delete Card</button>
                </div>
            </div>
        `;
    }).join('');
}

function calculateCardBalance(cardName) {
    const card = state.cards.find(c => c.cardName === cardName);
    if (!card) return 0;
    const transactions = state.transactions.filter(t => t.account === cardName);
    const income = transactions.filter(t => t.type.toLowerCase() === 'income').reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const expenses = transactions.filter(t => t.type.toLowerCase() === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return card.initialBalance + income - expenses;
}


function updateChart() {
    const canvas = document.getElementById('transactionChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const monthlyData = getMonthlyData();
    drawBarChart(ctx, canvas.width, canvas.height, monthlyData);
}

function getMonthlyData() {
    const months = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        const monthTransactions = state.transactions.filter(t => t.dateTime.startsWith(monthKey));
        const income = monthTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const expenses = monthTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
        months.push({ month: monthName, income, expenses });
    }
    return months;
}

function drawBarChart(ctx, width, height, data) {
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    ctx.clearRect(0, 0, width, height);
    const maxValue = Math.max(...data.map(d => Math.max(d.income, d.expenses)), 1000);
    const barWidth = chartWidth / (data.length * 2.5);
    const spacing = barWidth * 0.5;

    data.forEach((item, index) => {
        const x = padding + index * (barWidth * 2 + spacing);
        // Income
        const incH = (item.income / maxValue) * chartHeight;
        ctx.fillStyle = '#43e97b';
        ctx.fillRect(x, padding + chartHeight - incH, barWidth, incH);
        // Expense
        const expH = (item.expenses / maxValue) * chartHeight;
        ctx.fillStyle = '#f5576c';
        ctx.fillRect(x + barWidth + 5, padding + chartHeight - expH, barWidth, expH);
        // Label
        ctx.fillStyle = '#6b7280';
        ctx.textAlign = 'center';
        ctx.fillText(item.month, x + barWidth, height - 15);
    });
}

function updateFilterOptions() {
    const accountFilter = document.getElementById('filterAccount');
    if (accountFilter) {
        const accounts = [...new Set(state.transactions.map(t => t.account).filter(Boolean))];
        accountFilter.innerHTML = '<option value="">All Accounts</option>' + accounts.map(acc => `<option value="${acc}">${acc}</option>`).join('');
    }
    const categoryFilter = document.getElementById('filterCategory');
    if (categoryFilter) {
        const categories = [...new Set(state.transactions.map(t => t.category).filter(Boolean))];
        categoryFilter.innerHTML = '<option value="">All Categories</option>' + categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    }
}

// ============================================
// FILTERING
// ============================================
function applyFilters() {
    let filtered = [...state.transactions];

    // Type Filter
    const typeF = document.getElementById('filterType');
    if (typeF && typeF.value) filtered = filtered.filter(t => t.type === typeF.value);

    // Account Filter
    const accF = document.getElementById('filterAccount');
    if (accF && accF.value) filtered = filtered.filter(t => t.account === accF.value);

    // Category Filter
    const catF = document.getElementById('filterCategory');
    if (catF && catF.value) filtered = filtered.filter(t => t.category === catF.value);

    // Search / Description Filter (Manual Search)
    const searchF = document.getElementById('filterDescription');
    if (searchF && searchF.value) {
        const query = searchF.value.toLowerCase();
        filtered = filtered.filter(t =>
            (t.description && t.description.toLowerCase().includes(query)) ||
            (t.transferredTo && t.transferredTo.toLowerCase().includes(query)) ||
            (t.category && t.category.toLowerCase().includes(query))
        );
    }

    // Amount Range
    const minF = document.getElementById('filterAmountMin');
    if (minF && minF.value) filtered = filtered.filter(t => Math.abs(t.amount) >= parseFloat(minF.value));

    const maxF = document.getElementById('filterAmountMax');
    if (maxF && maxF.value) filtered = filtered.filter(t => Math.abs(t.amount) <= parseFloat(maxF.value));

    // Date Range
    const startF = document.getElementById('filterDateStart');
    if (startF && startF.value) filtered = filtered.filter(t => new Date(t.dateTime) >= new Date(startF.value));

    const endF = document.getElementById('filterDateEnd');
    if (endF && endF.value) filtered = filtered.filter(t => new Date(t.dateTime) <= new Date(endF.value));

    state.filteredTransactions = filtered;
    updateTransactionsFullTable();

    // Update results count
    const countEl = document.getElementById('filterCount');
    if (countEl) countEl.textContent = `Found ${filtered.length} transactions`;
}

function clearAllFilters() {
    document.querySelectorAll('.filter-input').forEach(input => input.value = '');
    state.selectedRecipient = null;
    state.filteredTransactions = [...state.transactions];
    applyFilters(); // Re-apply to update table
}


function applyRecipientFilter(recipient) {
    state.selectedRecipient = recipient;
    state.filteredTransactions = state.transactions.filter(t => t.transferredTo === recipient);
    showPage('transactions');
}

function updateTransactionsFullTable() {
    const tableBody = document.getElementById('transactionsFullTable');
    if (!tableBody) return;
    if (state.filteredTransactions.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No transactions found</td></tr>';
        return;
    }
    tableBody.innerHTML = state.filteredTransactions.map(t => `
        <tr>
            <td>${t.dateTime}</td>
            <td>${t.transferredTo}</td>
            <td><span class="type-badge ${t.type.toLowerCase()}">${t.type}</span></td>
            <td>${t.account}</td>
            <td>${t.category}</td>
            <td>${t.description}</td>
            <td class="${t.type === 'Income' ? 'positive' : 'negative'}">${t.type === 'Income' ? '+' : '-'}${formatCurrency(Math.abs(t.amount))}</td>
        </tr>
    `).join('');
}

// ============================================
// PAGE NAVIGATION
// ============================================
function showPage(pageName) {
    state.currentPage = pageName;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById(`${pageName}Page`);
    if (page) page.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.dataset.page === pageName) item.classList.add('active');
        else item.classList.remove('active');
    });

    if (pageName === 'transactions') updateTransactionsFullTable();
    else if (pageName === 'cards') updateCardsPage();
    else if (pageName === 'analytics') updateAnalyticsPage();
}

// ============================================
// EVENT HANDLERS
// ============================================
function handleRecipientClick(recipient) {
    applyRecipientFilter(recipient);
}

async function handleDeleteCard(cardName) {
    if (!confirm(`Are you sure?`)) return;
    showLoadingState();
    const res = await deleteCard(cardName);
    if (res.success !== false) await loadDashboardData();
    hideLoadingState();
}

// ============================================
// MODAL MANAGEMENT
// ============================================
function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('active');
    if (id === 'addTransactionModal') {
        const accS = document.getElementById('transactionAccount');
        if (accS && state.cards.length > 0) {
            accS.innerHTML = '<option value="">Select Account</option>' + state.cards.map(c => `<option value="${c.cardName}">${c.cardName}</option>`).join('');
        }
    }
}

function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('active');
}

async function handleTransactionSubmit(e) {
    e.preventDefault();
    const data = {
        dateTime: document.getElementById('transactionDate').value.replace('T', ' '),
        transferredTo: document.getElementById('transactionTo').value,
        type: document.getElementById('transactionType').value,
        account: document.getElementById('transactionAccount').value,
        category: document.getElementById('transactionCategory').value,
        description: document.getElementById('transactionDescription').value,
        amount: parseFloat(document.getElementById('transactionAmount').value)
    };
    if (data.type === 'Expense') data.amount = -Math.abs(data.amount);
    showLoadingState();
    const res = await addTransaction(data);
    if (res.success !== false) {
        closeModal('addTransactionModal');
        await loadDashboardData();
    }
    hideLoadingState();
}

async function handleCardSubmit(e) {
    e.preventDefault();
    const data = {
        cardName: document.getElementById('cardName').value,
        cardType: document.getElementById('cardType').value,
        last4Digits: document.getElementById('cardLast4').value,
        initialBalance: parseFloat(document.getElementById('cardInitialBalance').value),
        bankName: document.getElementById('cardBank').value,
        color: document.getElementById('cardColor').value
    };
    showLoadingState();
    const res = await addCard(data);
    if (res.success !== false) {
        closeModal('addCardModal');
        await loadDashboardData();
    }
    hideLoadingState();
}

function startAutoRefresh() {
    if (state.refreshTimer) clearInterval(state.refreshTimer);
    state.refreshTimer = setInterval(() => {
        if (state.isLoggedIn) loadDashboardData();
    }, CONFIG.REFRESH_INTERVAL);
}

// ============================================
// AUTHENTICATION LOGIC
// ============================================
function checkAuth() {
    const savedUser = localStorage.getItem('currentUser');
    const isRemembered = localStorage.getItem('remembered') === 'true';

    if (savedUser && isRemembered) {
        state.isLoggedIn = true;
        state.currentUser = savedUser;
        document.getElementById('loginOverlay').classList.add('hidden');
        hideLoadingOverlay();
    } else {
        state.isLoggedIn = false;
        document.getElementById('loginOverlay').classList.remove('hidden');
        // Pre-fill username if exists
        if (savedUser) document.getElementById('loginUsername').value = savedUser;
    }
    hideLoadingOverlay(); // Ensure loading overlay is hidden after auth checks
}


async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    const errorEl = document.getElementById('loginError');

    showLoadingState();
    errorEl.classList.add('hidden');

    try {
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'login', username, password }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });

        const result = await response.json();

        if (result.success) {
            state.isLoggedIn = true;
            state.currentUser = username;

            if (rememberMe) {
                localStorage.setItem('currentUser', username);
                localStorage.setItem('remembered', 'true');
            } else {
                localStorage.removeItem('currentUser');
                localStorage.removeItem('remembered');
            }

            document.getElementById('loginOverlay').classList.add('hidden');
            await loadDashboardData();
            startAutoRefresh();
            showPage('dashboard');
            hideLoadingOverlay();
        } else {
            errorEl.textContent = result.error || 'Invalid credentials';
            errorEl.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Login error:', error);
        errorEl.textContent = 'Server connection failed. Try again.';
        errorEl.classList.remove('hidden');
    } finally {
        hideLoadingState();
    }
}

function handleLogout() {
    state.isLoggedIn = false;
    state.currentUser = null;
    if (localStorage.getItem('remembered') !== 'true') {
        localStorage.removeItem('currentUser');
    }
    localStorage.removeItem('remembered');
    document.getElementById('loginOverlay').classList.remove('hidden');
    document.getElementById('loginPassword').value = '';
    if (state.refreshTimer) clearInterval(state.refreshTimer);
}

async function handlePasswordReset(e) {
    e.preventDefault();
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const msgEl = document.getElementById('passwordResetMsg');

    if (newPassword !== confirmPassword) {
        msgEl.textContent = '❌ New passwords do not match';
        msgEl.style.color = 'var(--error)';
        return;
    }

    showLoadingState();
    try {
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'resetPassword',
                username: state.currentUser,
                oldPassword,
                newPassword
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });

        const result = await response.json();
        if (result.success) {
            msgEl.textContent = '✅ Password updated successfully!';
            msgEl.style.color = 'var(--success)';
            document.getElementById('passwordResetForm').reset();
        } else {
            msgEl.textContent = `❌ ${result.error}`;
            msgEl.style.color = 'var(--error)';
        }
    } catch (error) {
        msgEl.textContent = '❌ Connection failed';
        msgEl.style.color = 'var(--error)';
    } finally {
        hideLoadingState();
    }
}


// ============================================
// THEME MANAGEMENT
// ============================================
function initTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    setTheme(theme);
    const toggle = document.getElementById('themeToggle');
    if (toggle) toggle.checked = (theme === 'dark');
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

// ============================================
// SPEND ANALYTICS
// ============================================
function initAnalytics() { }

function updateAnalyticsPage() {
    updateCategoryChart();
    updateTrendChart();
    updateAIInsights();
}

function updateCategoryChart() {
    const canvas = document.getElementById('categoryPieChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = 300;
    const exp = state.transactions.filter(t => t.type === 'Expense');
    if (exp.length === 0) return;
    const cats = {};
    exp.forEach(t => cats[t.category] = (cats[t.category] || 0) + Math.abs(t.amount));
    const entries = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((s, e) => s + e[1], 0);
    const colors = ['#667eea', '#764ba2', '#43e97b', '#38f9d7', '#f093fb'];

    let angle = -0.5 * Math.PI;
    const cx = canvas.width / 3, cy = canvas.height / 2, r = 100;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    entries.forEach((e, i) => {
        const slice = (e[1] / total) * 2 * Math.PI;
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, angle, angle + slice); ctx.fill();
        // Legend
        ctx.fillRect(cx + r + 20, 30 + i * 25, 15, 15);
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary');
        ctx.fillText(`${e[0]}: ${formatCurrency(e[1])}`, cx + r + 45, 42 + i * 25);
        angle += slice;
    });
}

function updateTrendChart() {
    const canvas = document.getElementById('spendingTrendChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    canvas.width = container.offsetWidth;
    canvas.height = 300;

    const data = getMonthlyData();
    const pad = 50, w = canvas.width - pad * 2, h = canvas.height - pad * 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate max value for scaling
    const maxVal = Math.max(...data.map(d => Math.max(d.expenses, d.income)), 1000) * 1.2;

    // Helper to draw a line
    function drawLine(key, color, label) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.setLineDash([]);

        data.forEach((d, i) => {
            const x = pad + i * (w / (data.length - 1));
            const y = pad + h - (d[key] / maxVal) * h;
            if (i === 0) ctx.moveTo(x, y);
            else {
                const prevX = pad + (i - 1) * (w / (data.length - 1));
                const prevY = pad + h - (data[i - 1][key] / maxVal) * h;
                // Bezier curve for smooth look
                ctx.bezierCurveTo(prevX + (x - prevX) / 2, prevY, prevX + (x - prevX) / 2, y, x, y);
            }
        });
        ctx.stroke();

        // Draw points and labels
        data.forEach((d, i) => {
            const x = pad + i * (w / (data.length - 1));
            const y = pad + h - (d[key] / maxVal) * h;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();

            // Labels for amounts
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary');
            ctx.font = '10px Inter';
            ctx.textAlign = 'center';
            if (d[key] > 0) ctx.fillText(`₹${(d[key] / 1000).toFixed(1)}k`, x, y - 10);
        });
    }

    // Draw Axes
    ctx.strokeStyle = 'rgba(150, 150, 150, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, pad); ctx.lineTo(pad, pad + h); ctx.lineTo(pad + w, pad + h);
    ctx.stroke();

    // Draw Income (Green) and Expense (Purple/Red)
    drawLine('income', '#43e97b', 'Income');
    drawLine('expenses', '#667eea', 'Expenses');

    // Months labels
    data.forEach((d, i) => {
        const x = pad + i * (w / (data.length - 1));
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary');
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(d.month, x, pad + h + 20);
    });
}


function updateAIInsights() {
    const list = document.getElementById('aiInsightsList');
    if (!list) return;

    const exp = state.transactions.filter(t => t.type.toLowerCase() === 'expense');
    const inc = state.transactions.filter(t => t.type.toLowerCase() === 'income');
    const totalExp = exp.reduce((s, t) => s + Math.abs(t.amount), 0);
    const totalInc = inc.reduce((s, t) => s + Math.abs(t.amount), 0);

    let insights = [];

    // 1. Spending Ratio
    const ratio = totalInc > 0 ? (totalExp / totalInc) * 100 : 100;
    if (ratio > 80) {
        insights.push({ type: 'warning', title: 'High Spending Ratio', text: `You've spent ${ratio.toFixed(1)}% of your income this month. Consider cutting down on non-essentials.` });
    } else {
        insights.push({ type: 'saving', title: 'Healthy Savings', text: `You've saved ${(100 - ratio).toFixed(1)}% of your income. Great job!` });
    }

    // 2. Top Category
    const cats = {};
    exp.forEach(t => cats[t.category] = (cats[t.category] || 0) + Math.abs(t.amount));
    const topCat = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];
    if (topCat) {
        insights.push({ type: 'info', title: `Top Expense: ${topCat[0]}`, text: `You spent ${formatCurrency(topCat[1])} on ${topCat[0]}. Is this within budget?` });
    }

    // 3. Investment Tip
    const surplus = totalInc - totalExp;
    if (surplus > 5000) {
        insights.push({ type: 'investment', title: 'Investment Opportunity', text: `You have ${formatCurrency(surplus)} surplus. Consider a Monthly SIP in Index Funds for 12-15% returns.` });
    }

    list.innerHTML = insights.map(i => `
        <div class="insight-item ${i.type}">
            <div class="insight-header">
                <h5>${i.title}</h5>
                <span class="insight-badge">${i.type}</span>
            </div>
            <p>${i.text}</p>
        </div>
    `).join('');
}


// AI Advisor
function setupAIAdvisor() {
    const btn = document.getElementById('aiSendBtn');
    const input = document.getElementById('aiChatInput');
    if (btn && input) btn.onclick = handleAIQuery;
}

async function handleAIQuery() {
    const input = document.getElementById('aiChatInput');
    const q = input.value.trim();
    if (!q) return;

    addChatMessage('user', q);
    input.value = '';

    const thinkingDiv = addChatMessage('ai', 'Thinking...');
    thinkingDiv.classList.add('thinking');

    // Simulate "thinking" steps
    const steps = [
        "Analyzing your transactions...",
        "Calculated expenses by category...",
        "Identifying spending patterns...",
        "Generating financial advice..."
    ];

    for (const step of steps) {
        thinkingDiv.textContent = step;
        await new Promise(r => setTimeout(r, 600));
    }

    const response = analyzeDataAndRespond(q);
    thinkingDiv.innerHTML = response;
    thinkingDiv.classList.remove('thinking');
}

function analyzeDataAndRespond(query) {
    const q = query.toLowerCase();
    const exp = state.transactions.filter(t => t.type.toLowerCase() === 'expense');
    const inc = state.transactions.filter(t => t.type.toLowerCase() === 'income');

    // 1. Handle specific category queries (e.g., "fuel in December")
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const monthIndex = months.findIndex(m => q.includes(m));
    const targetMonthPrefix = monthIndex !== -1 ? `2025-${String(monthIndex + 1).padStart(2, '0')}` : null;

    // Check for categories
    const categories = [...new Set(state.transactions.map(t => t.category.toLowerCase()))];
    const mentionedCategory = categories.find(c => q.includes(c));

    if (mentionedCategory) {
        let filtered = exp.filter(t => t.category.toLowerCase() === mentionedCategory);
        let timeLabel = "overall";

        if (targetMonthPrefix) {
            filtered = filtered.filter(t => t.dateTime.startsWith(targetMonthPrefix));
            timeLabel = `in ${months[monthIndex]}`;
        }

        const total = filtered.reduce((s, t) => s + Math.abs(t.amount), 0);
        const count = filtered.length;

        if (count > 0) {
            return `I found **${count} transactions** for **${mentionedCategory}** ${timeLabel}. You've spent a total of **${formatCurrency(total)}**. <br><br>💡 To save on this, try to batch purchases or look for loyalty rewards.`;
        } else {
            return `I couldn't find any expenses for **${mentionedCategory}** ${timeLabel}. Your records look clean in this area!`;
        }
    }

    // 2. Handle Investment advice
    if (q.includes('invest') || q.includes('save')) {
        const totalInc = inc.reduce((s, t) => s + Math.abs(t.amount), 0);
        const totalExp = exp.reduce((s, t) => s + Math.abs(t.amount), 0);
        const savings = totalInc - totalExp;

        return `Based on your current balance and habits:
        <ul>
            <li>**Emergency Fund:** Keep at least ${formatCurrency(totalExp * 3)} in a high-interest savings account.</li>
            <li>**Mutual Funds:** Since you have a surplus of ${formatCurrency(savings)}, consider an Index Fund SIP for consistent 12% growth.</li>
            <li>**Fixed Deposits:** If you want 0 risk, current rates are around 7% for 1-year terms.</li>
        </ul>
        Avoid overspending on non-essential categories (top: ${getTopCategory()}) to increase your monthly investment power.`;
    }

    // 3. Handle overspending guidance
    if (q.includes('spend') || q.includes('budget')) {
        const topCat = getTopCategory();
        return `You've been spending most on **${topCat}**. <br><br>Checking your history, I recommend setting a monthly limit for this. You could save roughly **15% more** by switching to generic brands or reducing subscription frequencies.`;
    }

    // 4. Fallback General Summary
    return `Hello! I'm your Financial Advisor. Currently, your total income is **${formatCurrency(getTotalIncome())}** and expenses are **${formatCurrency(getTotalExpenses())}**. <br><br>How can I help you today? You can ask about specific categories (fuel, food), months, or investment tips!`;
}

function getTopCategory() {
    const cats = {};
    state.transactions.filter(t => t.type.toLowerCase() === 'expense').forEach(t => cats[t.category] = (cats[t.category] || 0) + Math.abs(t.amount));
    const top = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];
    return top ? top[0] : 'None';
}

function getTotalIncome() {
    return state.transactions.filter(t => t.type.toLowerCase() === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
}

function getTotalExpenses() {
    return state.transactions.filter(t => t.type.toLowerCase() === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
}


function addChatMessage(role, text) {
    const container = document.getElementById('aiChatMessages');
    const div = document.createElement('div');
    div.className = `message ${role}`;
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
}

// ============================================
// UTILITIES
// ============================================
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
}

function formatDateTime(date) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
}

function adjustColor(color, amount) {
    if (!color.startsWith('#')) return color;
    const num = parseInt(color.slice(1), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

function showLoadingState() {
    const btn = document.getElementById('refreshBtn');
    if (btn) btn.style.opacity = '0.5';
}

function hideLoadingState() {
    const btn = document.getElementById('refreshBtn');
    if (btn) btn.style.opacity = '1';
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('hidden');
}

function showSuccess(m) { console.log('✅', m); }
function showError(m) {
    console.error('❌', m);
    alert(m);
}


window.handleRecipientClick = handleRecipientClick;
window.handleDeleteCard = handleDeleteCard;

window.addEventListener('resize', debounce(() => {
    if (state.currentPage === 'dashboard') updateChart();
    if (state.currentPage === 'analytics') updateAnalyticsPage();
}, 250));
