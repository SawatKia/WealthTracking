// src/App.tsx
import React from "react";
import IncomeExpenses from "./Pages/IncomeExpenseList";
import PhoneScreen from "./Components/Screen";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 flex items-center justify-center">
      <PhoneScreen>
        <IncomeExpenses />
      </PhoneScreen>
    </div>
  );
}

export default App;
