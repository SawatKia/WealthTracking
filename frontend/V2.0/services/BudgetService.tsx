export async function getBudgetData() {
    return [
      { id: "1", category: "Food", budget: 500, spent: 375 },
      { id: "2", category: "Groceries", budget: 300, spent: 1100 }, // Overspent
      { id: "3", category: "Transport", budget: 200, spent: 120 },
    ];
  }
  