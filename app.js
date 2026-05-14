// script.js - Professional Expense Management System

// Expense array to store all transactions
let expenses = [];

// DOM Elements
const descEl = document.getElementById('descInput');
const amountEl = document.getElementById('amountInput');
const dateEl = document.getElementById('dateInput');
const categoryEl = document.getElementById('categorySelect');
const addBtn = document.getElementById('addBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const expenseListDiv = document.getElementById('expenseList');
const totalAmountSpan = document.getElementById('totalAmount');
const todayAmountSpan = document.getElementById('todayAmount');
const entriesCountSpan = document.getElementById('entriesCount');
const filterCategoryEl = document.getElementById('filterCategory');
const filterDateInput = document.getElementById('filterDateInput');
const resetFilterBtn = document.getElementById('resetFilterBtn');

// Helper: Set default date as today's date
function setDefaultDate() {
    if (!dateEl.value) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        dateEl.value = `${year}-${month}-${day}`;
    }
}

// Load expenses from localStorage
function loadExpenses() {
    const stored = localStorage.getItem('expense_flow_db');
    if (stored) {
        try {
            expenses = JSON.parse(stored);
            if (!Array.isArray(expenses)) expenses = [];
        } catch(e) {
            expenses = [];
        }
    } else {
        // Seed demo data for better first-time experience
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        expenses = [
            { id: Date.now() + 101, description: "Morning Coffee", amount: 4.50, date: todayStr, category: "food" },
            { id: Date.now() + 102, description: "Uber Ride", amount: 12.30, date: todayStr, category: "transport" },
            { id: Date.now() + 103, description: "Netflix Subscription", amount: 15.99, date: yesterdayStr, category: "entertainment" },
            { id: Date.now() + 104, description: "Electricity Bill", amount: 42.00, date: yesterdayStr, category: "bills" },
            { id: Date.now() + 105, description: "Groceries", amount: 68.50, date: yesterdayStr, category: "shopping" }
        ];
        saveExpenses();
    }
    renderAll();
}

// Save expenses to localStorage
function saveExpenses() {
    localStorage.setItem('expense_flow_db', JSON.stringify(expenses));
}

// Add new expense
function addExpense() {
    let description = descEl.value.trim();
    let amount = parseFloat(amountEl.value);
    let date = dateEl.value;
    let category = categoryEl.value;

    // Validation
    if (!description) {
        alert("Please enter a description");
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid positive amount");
        return;
    }
    if (!date) {
        alert("Please select a date");
        return;
    }

    // Create new expense object
    const newExpense = {
        id: Date.now() + Math.floor(Math.random() * 10000),
        description: description,
        amount: amount,
        date: date,
        category: category
    };
    
    expenses.push(newExpense);
    saveExpenses();
    
    // Reset form fields
    descEl.value = '';
    amountEl.value = '';
    setDefaultDate();
    categoryEl.value = 'food';
    
    renderAll();
    
    // Optional: subtle success feedback
    addBtn.style.transform = 'scale(0.98)';
    setTimeout(() => {
        addBtn.style.transform = '';
    }, 150);
}

// Delete single expense by ID
function deleteExpense(id) {
    expenses = expenses.filter(exp => exp.id !== id);
    saveExpenses();
    renderAll();
}

// Clear all expenses
function wipeAllData() {
    if (confirm("⚠️ Are you sure? All expense records will be permanently deleted.")) {
        expenses = [];
        saveExpenses();
        renderAll();
    }
}

// Get filtered expenses based on category and date filters
function getFilteredExpenses() {
    let filtered = [...expenses];
    const catFilter = filterCategoryEl.value;
    const dateFilter = filterDateInput.value;

    if (catFilter !== 'ALL') {
        filtered = filtered.filter(exp => exp.category === catFilter);
    }
    if (dateFilter) {
        filtered = filtered.filter(exp => exp.date === dateFilter);
    }
    
    // Sort by date descending (newest first)
    filtered.sort((a, b) => (a.date < b.date ? 1 : -1));
    return filtered;
}

// Compute global statistics
function computeGlobalStats() {
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    const todayTotal = expenses
        .filter(exp => exp.date === todayStr)
        .reduce((sum, exp) => sum + exp.amount, 0);
    
    const count = expenses.length;
    
    return { total, todayTotal, count };
}

// Update statistics UI
function updateStatsUI() {
    const { total, todayTotal, count } = computeGlobalStats();
    totalAmountSpan.innerText = total.toFixed(2);
    todayAmountSpan.innerText = todayTotal.toFixed(2);
    entriesCountSpan.innerText = count;
}

// Get category metadata (emoji and display name)
function getCategoryMeta(cat) {
    const categories = {
        food: { emoji: '🍕', label: 'Food' },
        transport: { emoji: '🚖', label: 'Transport' },
        entertainment: { emoji: '🎬', label: 'Entertainment' },
        bills: { emoji: '⚡', label: 'Bills' },
        shopping: { emoji: '🛍️', label: 'Shopping' },
        other: { emoji: '📌', label: 'Other' }
    };
    return categories[cat] || { emoji: '📌', label: 'Other' };
}

// Escape HTML to prevent XSS
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Render expense list with current filters
function renderExpenseList() {
    const filtered = getFilteredExpenses();
    
    if (filtered.length === 0) {
        expenseListDiv.innerHTML = `<div class="empty-state">📭 No matching expenses. Add a new one above.</div>`;
        return;
    }

    let html = '';
    filtered.forEach(exp => {
        const meta = getCategoryMeta(exp.category);
        html += `
            <div class="expense-item" data-id="${exp.id}">
                <div class="expense-left">
                    <div class="expense-title">${escapeHtml(exp.description)}</div>
                    <div class="expense-meta">
                        <span class="category-badge">${meta.emoji} ${meta.label}</span>
                        <span>📅 ${exp.date}</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center;">
                    <span class="expense-amount">₹ ${exp.amount.toFixed(2)}</span>
                    <button class="delete-icon" data-id="${exp.id}" title="Delete expense">✕</button>
                </div>
            </div>
        `;
    });
    
    expenseListDiv.innerHTML = html;

    // Attach delete event listeners to all delete buttons
    document.querySelectorAll('.delete-icon').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.getAttribute('data-id'));
            deleteExpense(id);
        });
    });
}

// Reset all filters
function resetFilters() {
    filterCategoryEl.value = 'ALL';
    filterDateInput.value = '';
    renderExpenseList();
}

// Master render function - updates everything
function renderAll() {
    updateStatsUI();
    renderExpenseList();
}

// Event Listeners
addBtn.addEventListener('click', addExpense);
clearAllBtn.addEventListener('click', wipeAllData);
filterCategoryEl.addEventListener('change', renderExpenseList);
filterDateInput.addEventListener('change', renderExpenseList);
resetFilterBtn.addEventListener('click', resetFilters);

// Allow Enter key to add expense
function handleEnterKey(e) {
    if (e.key === 'Enter' && (e.target.id === 'descInput' || e.target.id === 'amountInput')) {
        addExpense();
    }
}

descEl.addEventListener('keypress', handleEnterKey);
amountEl.addEventListener('keypress', handleEnterKey);

// Initialize the app
setDefaultDate();
loadExpenses();

// Console message for developer
console.log("ExpenseFlow initialized — data persists in localStorage");