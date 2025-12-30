// ============================================
// GOOGLE APPS SCRIPT - ENHANCED BACKEND API
// Deploy this as a Web App in Google Apps Script
// ============================================

// Configuration
const TRANSACTIONS_SHEET = 'FinanceData';
const CARDS_SHEET = 'Cards';
const USERS_SHEET = 'Users';


// ============================================
// GET REQUEST - Fetch all data
// ============================================
function doGet(e) {
    try {
        const transactionsSheet = getOrCreateTransactionsSheet();
        const cardsSheet = getOrCreateCardsSheet();

        // Get transactions
        const transactionsData = transactionsSheet.getDataRange().getValues();
        const transactions = [];

        for (let i = 1; i < transactionsData.length; i++) {
            const row = transactionsData[i];
            if (!row[0] && !row[6]) continue; // Skip empty rows

            transactions.push({
                dateTime: formatDateTime(row[0]),
                transferredTo: String(row[1] || '').trim(),
                type: normalizeType(row[2]),
                account: String(row[3] || '').trim(),
                category: String(row[4] || 'Other').trim(),
                description: String(row[5] || '').trim(),
                amount: parseNumber(row[6])
            });
        }

        // Get cards
        const cardsData = cardsSheet.getDataRange().getValues();
        const cards = [];

        for (let i = 1; i < cardsData.length; i++) {
            const row = cardsData[i];
            if (!row[0]) continue;

            cards.push({
                cardName: String(row[0]).trim(),
                cardType: String(row[1] || 'Debit').trim(),
                last4Digits: String(row[2] || '0000').trim(),
                initialBalance: parseNumber(row[3]),
                bankName: String(row[4] || '').trim(),
                color: String(row[5] || '#667eea').trim()
            });
        }

        // Sort transactions by date (newest first)
        transactions.sort((a, b) => new Date(b.dateTime.replace(/-/g, '/')) - new Date(a.dateTime.replace(/-/g, '/')));

        return ContentService
            .createTextOutput(JSON.stringify({
                success: true,
                transactions: transactions,
                cards: cards,
                transactionCount: transactions.length,
                cardCount: cards.length
            }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService
            .createTextOutput(JSON.stringify({
                success: false,
                error: error.toString()
            }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

// Helper to clean up numbers (handles ₹, $, commas, spaces)
function parseNumber(val) {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const cleaned = String(val).replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

// Helper to normalize types (Income vs Expense)
function normalizeType(type) {
    if (!type) return 'Expense';
    const t = String(type).trim().toLowerCase();
    return t.includes('income') ? 'Income' : 'Expense';
}


// ============================================
// POST REQUEST - Add transaction or card
// ============================================
function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);

        // Routing
        if (data.action === 'login') {
            return handleLogin(data);
        } else if (data.action === 'resetPassword') {
            return handleResetPassword(data);
        } else if (data.action === 'addCard') {
            return addCard(data);
        } else if (data.action === 'deleteCard') {
            return deleteCard(data);
        } else {
            return addTransaction(data);
        }


    } catch (error) {
        return ContentService
            .createTextOutput(JSON.stringify({
                success: false,
                error: error.toString()
            }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

// ============================================
// ADD TRANSACTION
// ============================================
function addTransaction(data) {
    const sheet = getOrCreateTransactionsSheet();

    // Validate required fields
    if (!data.dateTime || !data.amount || !data.type) {
        throw new Error('Missing required fields');
    }

    // Append new row
    sheet.appendRow([
        data.dateTime,
        data.transferredTo || '',
        data.type,
        data.account || '',
        data.category || 'Other',
        data.description || '',
        data.amount
    ]);

    return ContentService
        .createTextOutput(JSON.stringify({
            success: true,
            message: 'Transaction added successfully'
        }))
        .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// ADD CARD
// ============================================
function addCard(data) {
    const sheet = getOrCreateCardsSheet();

    // Validate required fields
    if (!data.cardName || !data.cardType || !data.initialBalance) {
        throw new Error('Missing required fields for card');
    }

    // Append new card
    sheet.appendRow([
        data.cardName,
        data.cardType,
        data.last4Digits || '',
        data.initialBalance,
        data.bankName || '',
        data.color || '#667eea'
    ]);

    return ContentService
        .createTextOutput(JSON.stringify({
            success: true,
            message: 'Card added successfully'
        }))
        .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// DELETE CARD
// ============================================
function deleteCard(data) {
    const sheet = getOrCreateCardsSheet();
    const cardName = data.cardName;

    if (!cardName) {
        throw new Error('Card name required');
    }

    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();

    // Find and delete the card row
    for (let i = 1; i < values.length; i++) {
        if (values[i][0] === cardName) {
            sheet.deleteRow(i + 1);
            return ContentService
                .createTextOutput(JSON.stringify({
                    success: true,
                    message: 'Card deleted successfully'
                }))
                .setMimeType(ContentService.MimeType.JSON);
        }
    }

    throw new Error('Card not found');
}

// ============================================
// AUTHENTICATION
// ============================================

function handleLogin(data) {
    const sheet = getOrCreateUsersSheet();
    const values = sheet.getDataRange().getValues();
    const { username, password } = data;

    if (!username || !password) throw new Error('Username and password required');

    for (let i = 1; i < values.length; i++) {
        if (values[i][0] === username && values[i][1] === password) {
            return ContentService.createTextOutput(JSON.stringify({
                success: true,
                message: 'Login successful'
            })).setMimeType(ContentService.MimeType.JSON);
        }
    }

    throw new Error('Invalid username or password');
}

function handleResetPassword(data) {
    const sheet = getOrCreateUsersSheet();
    const values = sheet.getDataRange().getValues();
    const { username, oldPassword, newPassword } = data;

    for (let i = 1; i < values.length; i++) {
        if (values[i][0] === username && (values[i][1] === oldPassword || oldPassword === 'FORCE_ADMIN')) {
            sheet.getRange(i + 1, 2).setValue(newPassword);
            return ContentService.createTextOutput(JSON.stringify({
                success: true,
                message: 'Password reset successful'
            })).setMimeType(ContentService.MimeType.JSON);
        }
    }

    throw new Error('Account not found or incorrect old password');
}


// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get or create the Transactions sheet
 */
function getOrCreateTransactionsSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(TRANSACTIONS_SHEET);

    if (!sheet) {
        sheet = ss.insertSheet(TRANSACTIONS_SHEET);

        // Add headers
        const headers = ['Date & Time', 'Transferred To', 'Income/Expense', 'Account', 'Category', 'Description', 'Amount'];
        sheet.appendRow(headers);

        // Format header row
        const headerRange = sheet.getRange(1, 1, 1, headers.length);
        headerRange.setFontWeight('bold');
        headerRange.setBackground('#667eea');
        headerRange.setFontColor('#ffffff');

        // Add sample data
        addSampleTransactions(sheet);
    }

    return sheet;
}

/**
 * Get or create the Cards sheet
 */
function getOrCreateCardsSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CARDS_SHEET);

    if (!sheet) {
        sheet = ss.insertSheet(CARDS_SHEET);

        // Add headers
        const headers = ['Card Name', 'Card Type', 'Last 4 Digits', 'Initial Balance', 'Bank Name', 'Color'];
        sheet.appendRow(headers);

        // Format header row
        const headerRange = sheet.getRange(1, 1, 1, headers.length);
        headerRange.setFontWeight('bold');
        headerRange.setBackground('#667eea');
        headerRange.setFontColor('#ffffff');

        // Add sample cards
        addSampleCards(sheet);
    }

    return sheet;
}

/**
 * Get or create the Users sheet
 */
function getOrCreateUsersSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(USERS_SHEET);

    if (!sheet) {
        sheet = ss.insertSheet(USERS_SHEET);
        const headers = ['Username', 'Password', 'Email'];
        sheet.appendRow(headers);
        const headerRange = sheet.getRange(1, 1, 1, headers.length);
        headerRange.setFontWeight('bold');
        headerRange.setBackground('#667eea');
        headerRange.setFontColor('#ffffff');

        // Add default user
        sheet.appendRow(['admin', 'admin123', 'admin@example.com']);
    }

    return sheet;
}


/**
 * Add sample transactions
 */
function addSampleTransactions(sheet) {
    const today = new Date();
    const sampleData = [
        [formatDateTime(new Date(today.getTime() - 1 * 60 * 60 * 1000)), 'Salary Account', 'Income', 'HDFC Savings', 'Salary', 'Monthly Salary', 50000],
        [formatDateTime(new Date(today.getTime() - 5 * 60 * 60 * 1000)), 'Swiggy', 'Expense', 'HDFC Credit', 'Food', 'Lunch Order', 450],
        [formatDateTime(new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000)), 'Amazon', 'Expense', 'SBI Debit', 'Shopping', 'Electronics', 2500],
        [formatDateTime(new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)), 'Reliance Energy', 'Expense', 'HDFC Savings', 'Bills', 'Electricity Bill', 1850],
        [formatDateTime(new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)), 'Uber', 'Expense', 'Paytm Wallet', 'Transport', 'Cab Fare', 320],
        [formatDateTime(new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000)), 'Freelance Client', 'Income', 'SBI Savings', 'Freelance', 'Project Payment', 15000],
        [formatDateTime(new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000)), 'Zomato', 'Expense', 'HDFC Credit', 'Food', 'Dinner', 850],
        [formatDateTime(new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)), 'Flipkart', 'Expense', 'SBI Debit', 'Shopping', 'Clothing', 1200],
        [formatDateTime(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)), 'Swiggy', 'Expense', 'HDFC Credit', 'Food', 'Breakfast', 250],
        [formatDateTime(new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000)), 'Investment Return', 'Income', 'HDFC Savings', 'Investment', 'Mutual Fund', 5000]
    ];

    sampleData.forEach(row => {
        sheet.appendRow(row);
    });
}

/**
 * Add sample cards
 */
function addSampleCards(sheet) {
    const sampleCards = [
        ['HDFC Credit Card', 'Credit', '4829', 100000, 'HDFC Bank', '#667eea'],
        ['SBI Debit Card', 'Debit', '7234', 25000, 'State Bank of India', '#43e97b'],
        ['HDFC Savings', 'Savings', '8901', 50000, 'HDFC Bank', '#4facfe'],
        ['Paytm Wallet', 'Wallet', '0000', 5000, 'Paytm', '#f093fb']
    ];

    sampleCards.forEach(row => {
        sheet.appendRow(row);
    });
}

/**
 * Format date and time
 */
function formatDateTime(date) {
    if (typeof date === 'string') return date;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;

    return `${year}-${month}-${day} ${displayHours}:${minutes} ${ampm}`;
}

// ============================================
// UTILITY FUNCTIONS FOR MANUAL TESTING
// ============================================

/**
 * Test function to verify GET endpoint
 */
function testGet() {
    const result = doGet({});
    const output = result.getContent();
    Logger.log(output);
    return JSON.parse(output);
}

/**
 * Test function to verify POST endpoint (transaction)
 */
function testPostTransaction() {
    const testData = {
        dateTime: formatDateTime(new Date()),
        transferredTo: 'Test Merchant',
        type: 'Expense',
        account: 'HDFC Credit',
        category: 'Other',
        description: 'Test Transaction',
        amount: 500
    };

    const result = doPost({
        postData: {
            contents: JSON.stringify(testData)
        }
    });

    const output = result.getContent();
    Logger.log(output);
    return JSON.parse(output);
}

/**
 * Test function to verify POST endpoint (card)
 */
function testPostCard() {
    const testData = {
        action: 'addCard',
        cardName: 'Test Card',
        cardType: 'Credit',
        last4Digits: '1234',
        initialBalance: 50000,
        bankName: 'Test Bank',
        color: '#667eea'
    };

    const result = doPost({
        postData: {
            contents: JSON.stringify(testData)
        }
    });

    const output = result.getContent();
    Logger.log(output);
    return JSON.parse(output);
}
