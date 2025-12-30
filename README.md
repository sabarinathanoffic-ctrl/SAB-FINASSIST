# Enhanced Finance Dashboard - Setup Guide

## 📋 Overview

A comprehensive finance dashboard with **liquid glass UI**, **advanced filtering**, **cards management**, and **real-time Google Sheets integration**. Features Indian Rupee (₹) currency and fully responsive design.

---

## 🚀 Quick Start

### Step 1: Set Up Google Sheets

1. **Create a new Google Sheet**
   - Go to [Google Sheets](https://sheets.google.com)
   - Create a new spreadsheet
   - Name it "Finance Dashboard"

2. **The sheets will be auto-created by the script**
   - **FinanceData** sheet for transactions
   - **Cards** sheet for card/account management

---

### Step 2: Deploy Google Apps Script

1. **Open Script Editor**
   - In your Google Sheet, click **Extensions** → **Apps Script**

2. **Copy the Backend Code**
   - Open `google-apps-script.js`
   - Copy ALL the code
   - Paste into Apps Script editor

3. **Save and Deploy**
   - Save the project
   - Click **Deploy** → **New deployment**
   - Select **Web app**
   - Configure:
     - **Execute as**: Me
     - **Who has access**: Anyone
   - Click **Deploy**
   - **Authorize** the script
   - **Copy the Web App URL**

---

### Step 3: Configure the Dashboard

1. **Update `script.js`**
   - Open `script.js` (line 10)
   - Replace:
     ```javascript
     GOOGLE_SCRIPT_URL: 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE',
     ```
   - With your actual URL:
     ```javascript
     GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_ID/exec',
     ```

2. **Save the file**

---

### Step 4: Run the Dashboard

1. **Open `index.html` in your browser**
   - Double-click the file
   - Or use a local server:
     ```bash
     python -m http.server 8000
     # Visit: http://localhost:8000
     ```

2. **The dashboard will load with demo data**

---

## ✨ New Features

### 1. **Indian Rupee Currency (₹)**
   - All amounts displayed in ₹
   - Indian number formatting

### 2. **Fully Responsive Design**
   - Auto-adapts to any screen size
   - Mobile-first approach
   - Fluid typography and spacing
   - Touch-friendly on mobile

### 3. **Enhanced Google Sheets Schema**

**Transactions Sheet (FinanceData)**:
```
| Date & Time         | Transferred To | Income/Expense | Account      | Category  | Description | Amount |
|---------------------|----------------|----------------|--------------|-----------|-------------|--------|
| 2024-12-29 10:30 AM | Swiggy         | Expense        | HDFC Credit  | Food      | Lunch       | -450   |
```

**Cards Sheet**:
```
| Card Name    | Card Type | Last 4 Digits | Initial Balance | Bank Name | Color   |
|--------------|-----------|---------------|-----------------|-----------|---------|
| HDFC Credit  | Credit    | 4829          | 100000          | HDFC Bank | #667eea |
```

### 4. **Recent Transfers**
   - Shows top 4 most frequent recipients
   - Click any recipient to filter transactions
   - Displays transaction count per recipient
   - Visual active state when filtered

### 5. **Advanced Transaction Filtering**
   - **Multi-filter support** - all filters work simultaneously
   - Filter by:
     - Type (Income/Expense)
     - Account/Card
     - Category
     - Transferred To
     - Description (search)
     - Amount range (min-max)
     - Date range
   - Real-time filter results
   - Clear all filters button

### 6. **Cards Management**
   - Add unlimited cards/accounts
   - Auto-calculated current balances
   - Track per-card transactions
   - Visual card designs with custom colors
   - Delete cards with confirmation
   - Card statistics:
     - Initial balance
     - Current balance
     - Total spent
     - Total received
     - Transaction count

### 7. **Cards Display in Dashboard**
   - Right sidebar shows your cards
   - Displays current balance
   - Quick visual reference
   - Scrollable card list

---

## 📱 Pages

### Dashboard
- Summary cards (Balance, Income, Expenses)
- Monthly chart
- Latest 5 transactions
- Cards display
- Recent transfers

### Transactions
- Full transaction list
- Advanced filters
- Sortable table
- All transaction details

### Cards
- All cards in grid layout
- Add new cards
- Card statistics
- Delete cards
- Visual card designs

---

## 🎨 Responsive Breakpoints

- **Desktop**: 1200px+ (3-column layout)
- **Tablet**: 768px - 1200px (single column, optimized)
- **Mobile**: < 768px (stacked, touch-friendly)
- **Small Mobile**: < 480px (compact)

---

## 🔧 Adding a Transaction

1. Click the **+** button in header
2. Fill in:
   - **Date & Time**: When the transaction occurred
   - **Transferred To**: Recipient/merchant name
   - **Type**: Income or Expense
   - **Account/Card**: Which card was used
   - **Category**: Transaction category
   - **Description**: Additional details
   - **Amount**: Transaction amount (₹)
3. Click **Add Transaction**
4. Data syncs to Google Sheets

---

## 💳 Adding a Card

1. Go to **Cards** page
2. Click **Add Card**
3. Fill in:
   - **Card Name**: e.g., "HDFC Credit Card"
   - **Card Type**: Credit/Debit/Savings/Wallet
   - **Bank Name**: Issuing bank
   - **Last 4 Digits**: Card number ending
   - **Initial Balance**: Starting balance (₹)
   - **Color**: Card color theme
4. Click **Add Card**
5. Card appears in dashboard and cards page

---

## 🔍 Using Filters

1. Go to **Transactions** page
2. Use filter dropdowns and inputs
3. **Multiple filters work together**:
   - Example: Show all "Food" expenses from "HDFC Credit" in December
4. Click **Clear Filters** to reset

---

## 📊 How Card Balances Work

```
Current Balance = Initial Balance + Total Income - Total Expenses
```

- Each transaction linked to a card updates its balance
- Balances calculated in real-time
- Displayed on cards page and dashboard

---

## 🐛 Troubleshooting

### "Using demo data" in console
- **Fix**: Update `GOOGLE_SCRIPT_URL` in `script.js`

### Filters not working
- **Check**: Make sure you're on the Transactions page
- **Check**: Try clearing filters and reapplying

### Cards not showing
- **Check**: Add at least one card
- **Check**: Verify Google Sheets has Cards sheet

### Mobile layout issues
- **Fix**: Clear browser cache
- **Check**: Ensure viewport meta tag is present

### Transactions not saving
- **Check**: Google Apps Script is deployed
- **Check**: Web App has "Anyone" access
- **Check**: Script is authorized

---

## 🎯 Tips

1. **Add cards first** before adding transactions
2. **Use consistent naming** for "Transferred To" field
3. **Recent Transfers** shows most frequent recipients
4. **Click recipients** to filter transactions
5. **All filters work together** for powerful queries
6. **Mobile-friendly** - use on any device

---

## 📝 Data Schema

### Transaction Fields
- **Date & Time**: `YYYY-MM-DD HH:MM AM/PM`
- **Transferred To**: String (merchant/recipient)
- **Income/Expense**: "Income" or "Expense"
- **Account**: Card/account name (must match Cards sheet)
- **Category**: String (Food, Transport, etc.)
- **Description**: String (additional details)
- **Amount**: Number (positive for income, negative for expense)

### Card Fields
- **Card Name**: String (unique identifier)
- **Card Type**: "Credit", "Debit", "Savings", or "Wallet"
- **Last 4 Digits**: String (4 digits)
- **Initial Balance**: Number
- **Bank Name**: String
- **Color**: Hex color code (e.g., #667eea)

---

## 🔒 Security Notes

- Script runs with YOUR permissions
- Data stored in YOUR Google Sheet
- For production:
  - Use "Anyone with Google account"
  - Implement authentication
  - Add rate limiting

---

## 🎉 Features Summary

✅ **Indian Rupee (₹) currency**
✅ **Fully responsive design**
✅ **Advanced multi-filtering**
✅ **Cards management**
✅ **Auto-calculated balances**
✅ **Recent transfers with click-to-filter**
✅ **Real-time Google Sheets sync**
✅ **Beautiful liquid glass UI**
✅ **Touch-friendly mobile interface**
✅ **No frameworks - pure HTML/CSS/JS**

---

## 📞 Support

Check browser console (F12) for:
- Error messages
- Debug logs
- Data sync status

---

## 🎨 Customization

### Change Colors
Edit `style.css` CSS variables (lines 10-30)

### Change Currency
Update `formatCurrency()` function in `script.js`

### Add Categories
Update category dropdowns in `index.html` and forms

### Modify Filters
Add/remove filter fields in Transactions page

---

## 🚀 Ready to Use!

Your enhanced finance dashboard is ready. Track your finances with style! 💰✨

**Key Pages:**
- **Dashboard**: Overview and quick stats
- **Transactions**: Detailed view with filters
- **Cards**: Manage your cards and accounts

**Key Features:**
- Click recipients in Recent Transfers to filter
- Use multiple filters simultaneously
- Cards auto-calculate balances
- Fully responsive on all devices
