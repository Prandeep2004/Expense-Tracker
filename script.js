import { Chart } from "@/components/ui/chart"
// Load expenses and budget from local storage
let expenses = JSON.parse(localStorage.getItem("expenses")) || []
let monthlyBudget = Number.parseInt(localStorage.getItem("monthlyBudget")) || 0
let currentEditIndex = -1

// DOM Elements
const expenseName = document.getElementById("expense-name")
const expenseAmount = document.getElementById("expense-amount")
const expenseDate = document.getElementById("expense-date")
const expenseCategory = document.getElementById("expense-category")
const expenseNotes = document.getElementById("expense-notes")
const recurringExpense = document.getElementById("recurring-expense")
const addExpenseButton = document.getElementById("add-expense-btn")
const monthlyBudgetInput = document.getElementById("monthly-budget")
const setBudgetButton = document.getElementById("set-budget")
const remainingBudgetElement = document.getElementById("remaining-budget")
const budgetAlertElement = document.getElementById("budget-alert")
const budgetAlertContainer = document.getElementById("budget-alert-container")
const expenseList = document.getElementById("expense-list")
const totalAmountElement = document.getElementById("total-amount")
const filterCategory = document.getElementById("filter-category")
const sortBy = document.getElementById("sort-by")
const searchExpense = document.getElementById("search-expense")
const exportDataButton = document.getElementById("export-data")
const backupDataButton = document.getElementById("backup-data")
const restoreDataButton = document.getElementById("restore-data")
const resetDataButton = document.getElementById("reset-data")
const themeToggle = document.getElementById("theme-toggle")
const expenseChartCanvas = document.getElementById("expense-chart")
const navToggle = document.querySelector(".nav-toggle")
const navLinks = document.querySelector(".nav-links")
const sections = document.querySelectorAll("section")

// Edit Modal Elements
const editModal = document.getElementById("edit-modal")
const closeModal = document.querySelector(".close-modal")
const editExpenseName = document.getElementById("edit-expense-name")
const editExpenseAmount = document.getElementById("edit-expense-amount")
const editExpenseDate = document.getElementById("edit-expense-date")
const editExpenseCategory = document.getElementById("edit-expense-category")
const editExpenseNotes = document.getElementById("edit-expense-notes")
const editRecurringExpense = document.getElementById("edit-recurring-expense")
const saveExpenseButton = document.getElementById("save-expense-btn")

// Toast Element
const toast = document.getElementById("toast")
const toastTitle = document.querySelector(".toast-title")
const toastMessage = document.querySelector(".toast-message")
const toastIcon = document.querySelector(".toast-icon i")

// Set today's date as default for date inputs
const today = new Date().toISOString().split("T")[0]
expenseDate.value = today

// Initialize Chart with custom colors
const chartColors = [
  "rgba(99, 102, 241, 0.7)", // Primary
  "rgba(245, 158, 11, 0.7)", // Secondary
  "rgba(16, 185, 129, 0.7)", // Success
  "rgba(59, 130, 246, 0.7)", // Info
  "rgba(239, 68, 68, 0.7)", // Danger
]

const expenseChart = new Chart(expenseChartCanvas, {
  type: "doughnut",
  data: {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: chartColors,
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          font: {
            family: "Inter",
            size: 12,
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || ""
            const value = context.raw || 0
            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0)
            const percentage = Math.round((value / total) * 100)
            return `${label}: ₹${value} (${percentage}%)`
          },
        },
      },
    },
    cutout: "65%",
    animation: {
      animateScale: true,
      animateRotate: true,
    },
  },
})

// Update UI
function updateUI() {
  renderExpenses()
  updateTotalAmount()
  updateRemainingBudget()
  updateChart()
}

// Add expense
addExpenseButton.addEventListener("click", () => {
  const name = expenseName.value.trim()
  const amount = Number.parseInt(expenseAmount.value.trim())
  const date = expenseDate.value
  const category = expenseCategory.value
  const notes = expenseNotes.value.trim()
  const isRecurring = recurringExpense.checked

  if (name && amount && date && category) {
    const expense = { name, amount, date, category, notes, isRecurring }
    expenses.push(expense)

    // Save to local storage
    localStorage.setItem("expenses", JSON.stringify(expenses))

    // Clear inputs
    expenseName.value = ""
    expenseAmount.value = ""
    expenseDate.value = today
    expenseCategory.value = "Food"
    expenseNotes.value = ""
    recurringExpense.checked = false

    // Update UI
    updateUI()

    // Show toast
    showToast("Success", "Expense added successfully", "check-circle")
  } else {
    showToast("Error", "Please fill all required fields", "exclamation-circle", "error")
  }
})

// Set monthly budget
setBudgetButton.addEventListener("click", () => {
  const budget = Number.parseInt(monthlyBudgetInput.value.trim())
  if (budget) {
    monthlyBudget = budget
    localStorage.setItem("monthlyBudget", monthlyBudget)
    updateUI()

    // Show toast
    showToast("Success", "Budget set successfully", "check-circle")

    // Clear input
    monthlyBudgetInput.value = ""
  } else {
    showToast("Error", "Please enter a valid budget amount", "exclamation-circle", "error")
  }
})

// Update remaining budget
function updateRemainingBudget() {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const remaining = monthlyBudget - total
  remainingBudgetElement.textContent = remaining

  // Update budget circle color based on remaining budget
  const budgetCircle = document.querySelector(".budget-circle")

  if (remaining < 0) {
    budgetCircle.style.background = "linear-gradient(135deg, var(--danger-color), #dc2626)"
    budgetAlertContainer.classList.remove("hidden", "warning")
    budgetAlertContainer.classList.add("danger")
    budgetAlertElement.innerHTML = '<i class="fas fa-exclamation-circle"></i> Budget Exceeded!'
  } else if (remaining < monthlyBudget * 0.2) {
    budgetCircle.style.background = "linear-gradient(135deg, var(--warning-color), #d97706)"
    budgetAlertContainer.classList.remove("hidden", "danger")
    budgetAlertContainer.classList.add("warning")
    budgetAlertElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Low Budget!'
  } else {
    budgetCircle.style.background = "linear-gradient(135deg, var(--primary-color), var(--info-color))"
    budgetAlertContainer.classList.add("hidden")
    budgetAlertContainer.classList.remove("warning", "danger")
    budgetAlertElement.textContent = ""
  }
}

// Update total amount
function updateTotalAmount() {
  const filteredCategory = filterCategory.value
  const searchQuery = searchExpense.value.trim().toLowerCase()

  let filteredExpenses = expenses
  if (filteredCategory !== "All") {
    filteredExpenses = filteredExpenses.filter((expense) => expense.category === filteredCategory)
  }

  if (searchQuery) {
    filteredExpenses = filteredExpenses.filter(
      (expense) =>
        expense.name.toLowerCase().includes(searchQuery) || expense.notes.toLowerCase().includes(searchQuery),
    )
  }

  const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  totalAmountElement.textContent = total
}

// Render expenses
function renderExpenses() {
  const filteredCategory = filterCategory.value
  const sortField = sortBy.value
  const searchQuery = searchExpense.value.trim().toLowerCase()

  let filteredExpenses = [...expenses]
  if (filteredCategory !== "All") {
    filteredExpenses = filteredExpenses.filter((expense) => expense.category === filteredCategory)
  }

  if (searchQuery) {
    filteredExpenses = filteredExpenses.filter(
      (expense) =>
        expense.name.toLowerCase().includes(searchQuery) || expense.notes.toLowerCase().includes(searchQuery),
    )
  }

  filteredExpenses.sort((a, b) => {
    if (sortField === "date") {
      return new Date(b.date) - new Date(a.date) // Newest first
    } else {
      return b.amount - a.amount // Highest first
    }
  })

  expenseList.innerHTML = ""

  if (filteredExpenses.length === 0) {
    const li = document.createElement("li")
    li.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-receipt"></i>
      <p>No expenses found</p>
    </div>
  `
    expenseList.appendChild(li)
    return
  }

  filteredExpenses.forEach((expense, index) => {
    const li = document.createElement("li")

    // Find the original index in the expenses array
    const originalIndex = expenses.findIndex(
      (e) =>
        e.name === expense.name &&
        e.amount === expense.amount &&
        e.date === expense.date &&
        e.category === expense.category,
    )

    // Get category icon
    let categoryIcon
    switch (expense.category) {
      case "Food":
        categoryIcon = "fas fa-utensils"
        break
      case "Transport":
        categoryIcon = "fas fa-car"
        break
      case "Entertainment":
        categoryIcon = "fas fa-film"
        break
      case "Utilities":
        categoryIcon = "fas fa-bolt"
        break
      default:
        categoryIcon = "fas fa-shopping-bag"
    }

    li.innerHTML = `
    <div class="expense-item">
      <div class="expense-details">
        <div class="expense-info">
          <div class="expense-name">${expense.name}</div>
          <div class="expense-meta">
            <span><i class="${categoryIcon}"></i> ${expense.category}</span>
            <span><i class="fas fa-rupee-sign"></i> ${expense.amount}</span>
            <span><i class="fas fa-calendar"></i> ${formatDate(expense.date)}</span>
            ${expense.isRecurring ? '<span><i class="fas fa-redo"></i> Recurring</span>' : ""}
          </div>
          ${expense.notes ? `<div class="expense-notes"><i class="fas fa-sticky-note"></i> ${expense.notes}</div>` : ""}
        </div>
        <div class="expense-actions">
          <button class="edit-btn" data-index="${originalIndex}"><i class="fas fa-edit"></i> Edit</button>
          <button class="delete-btn" data-index="${originalIndex}"><i class="fas fa-trash"></i> Delete</button>
        </div>
      </div>
    </div>
  `
    expenseList.appendChild(li)
  })

  // Add event listeners to edit and delete buttons
  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const index = Number.parseInt(this.getAttribute("data-index"))
      openEditModal(index)
    })
  })

  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const index = Number.parseInt(this.getAttribute("data-index"))
      deleteExpense(index)
    })
  })
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

// Open edit modal
function openEditModal(index) {
  currentEditIndex = index
  const expense = expenses[index]

  // Populate the edit form
  editExpenseName.value = expense.name
  editExpenseAmount.value = expense.amount
  editExpenseDate.value = expense.date
  editExpenseCategory.value = expense.category
  editExpenseNotes.value = expense.notes
  editRecurringExpense.checked = expense.isRecurring

  // Show the modal
  editModal.style.display = "block"
}

// Close edit modal
closeModal.addEventListener("click", () => {
  editModal.style.display = "none"
})

// Close modal when clicking outside
window.addEventListener("click", (event) => {
  if (event.target === editModal) {
    editModal.style.display = "none"
  }
})

// Save edited expense
saveExpenseButton.addEventListener("click", () => {
  const name = editExpenseName.value.trim()
  const amount = Number.parseInt(editExpenseAmount.value.trim())
  const date = editExpenseDate.value
  const category = editExpenseCategory.value
  const notes = editExpenseNotes.value.trim()
  const isRecurring = editRecurringExpense.checked

  if (name && amount && date && category && currentEditIndex !== -1) {
    const updatedExpense = { name, amount, date, category, notes, isRecurring }
    expenses[currentEditIndex] = updatedExpense

    // Save to local storage
    localStorage.setItem("expenses", JSON.stringify(expenses))

    // Close modal
    editModal.style.display = "none"

    // Update UI
    updateUI()

    // Show toast
    showToast("Success", "Expense updated successfully", "check-circle")
  } else {
    showToast("Error", "Please fill all required fields", "exclamation-circle", "error")
  }
})

// Delete expense
function deleteExpense(index) {
  if (confirm("Are you sure you want to delete this expense?")) {
    expenses.splice(index, 1)
    localStorage.setItem("expenses", JSON.stringify(expenses))
    updateUI()

    // Show toast
    showToast("Success", "Expense deleted successfully", "check-circle")
  }
}

// Update chart
function updateChart() {
  const categories = ["Food", "Transport", "Entertainment", "Utilities", "Other"]
  const data = categories.map((category) => {
    return expenses.filter((expense) => expense.category === category).reduce((sum, expense) => sum + expense.amount, 0)
  })

  // Only show categories with expenses
  const filteredCategories = []
  const filteredData = []
  const filteredColors = []

  categories.forEach((category, index) => {
    if (data[index] > 0) {
      filteredCategories.push(category)
      filteredData.push(data[index])
      filteredColors.push(chartColors[index])
    }
  })

  expenseChart.data.labels = filteredCategories
  expenseChart.data.datasets[0].data = filteredData
  expenseChart.data.datasets[0].backgroundColor = filteredColors

  // Update chart theme based on dark mode
  if (document.body.classList.contains("dark-mode")) {
    expenseChart.options.plugins.legend.labels.color = "#e5e7eb"
    expenseChart.data.datasets[0].borderColor = "#1f2937"
  } else {
    expenseChart.options.plugins.legend.labels.color = "#4b5563"
    expenseChart.data.datasets[0].borderColor = "#ffffff"
  }

  expenseChart.update()
}

// Export data as CSV
exportDataButton.addEventListener("click", () => {
  const csvContent =
    "data:text/csv;charset=utf-8," +
    "Name,Amount,Date,Category,Notes,Recurring\n" +
    expenses
      .map(
        (expense) =>
          `"${expense.name}",${expense.amount},"${expense.date}","${expense.category}","${expense.notes}",${expense.isRecurring}`,
      )
      .join("\n")
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", "expenses.csv")
  document.body.appendChild(link)
  link.click()

  // Show toast
  showToast("Success", "Data exported successfully", "check-circle")
})

// Backup data
backupDataButton.addEventListener("click", () => {
  const data = JSON.stringify({ expenses, monthlyBudget })
  const blob = new Blob([data], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "expense-tracker-backup.json"
  link.click()

  // Show toast
  showToast("Success", "Data backed up successfully", "check-circle")
})

// Restore data
restoreDataButton.addEventListener("click", () => {
  const input = document.createElement("input")
  input.type = "file"
  input.accept = "application/json"
  input.onchange = (e) => {
    const file = e.target.files[0]
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        if (data.expenses && Array.isArray(data.expenses)) {
          expenses = data.expenses
          monthlyBudget = data.monthlyBudget || 0
          localStorage.setItem("expenses", JSON.stringify(expenses))
          localStorage.setItem("monthlyBudget", monthlyBudget)
          updateUI()

          // Show toast
          showToast("Success", "Data restored successfully", "check-circle")
        } else {
          throw new Error("Invalid backup file")
        }
      } catch (error) {
        showToast("Error", "Failed to restore data. Invalid backup file.", "exclamation-circle", "error")
      }
    }
    reader.readAsText(file)
  }
  input.click()
})

// Reset all data
resetDataButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to reset all data? This action cannot be undone.")) {
    expenses = []
    monthlyBudget = 0
    localStorage.removeItem("expenses")
    localStorage.removeItem("monthlyBudget")
    updateUI()

    // Show toast
    showToast("Success", "All data has been reset", "check-circle")
  }
})

// Dark mode toggle
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode")

  if (document.body.classList.contains("dark-mode")) {
    themeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode'
  } else {
    themeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark Mode'
  }

  // Update chart theme
  updateChart()
})

// Mobile navigation toggle
navToggle.addEventListener("click", () => {
  navToggle.classList.toggle("active")
  navLinks.classList.toggle("active")
})

// Close mobile menu when clicking a link
navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navToggle.classList.remove("active")
    navLinks.classList.remove("active")
  })
})

// Show toast notification
function showToast(title, message, icon, type = "success") {
  toastTitle.textContent = title
  toastMessage.textContent = message

  // Set icon and color based on type
  if (type === "error") {
    toastIcon.className = "fas fa-exclamation-circle"
    toastIcon.style.color = "var(--danger-color)"
  } else {
    toastIcon.className = "fas fa-" + icon
    toastIcon.style.color = "var(--success-color)"
  }

  toast.classList.add("show")

  setTimeout(() => {
    toast.classList.remove("show")
  }, 3000)
}

// Animate sections on scroll
function animateSections() {
  sections.forEach((section) => {
    section.classList.add("section-fade-in")
  })
}

// Event listeners for filters
filterCategory.addEventListener("change", updateUI)
sortBy.addEventListener("change", updateUI)
searchExpense.addEventListener("input", updateUI)

// Make edit and delete functions globally accessible
window.editExpense = openEditModal
window.deleteExpense = deleteExpense

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  // Set initial theme
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.body.classList.add("dark-mode")
    themeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode'
  }

  // Animate sections
  setTimeout(animateSections, 100)

  // Initial render
  updateUI()
})

