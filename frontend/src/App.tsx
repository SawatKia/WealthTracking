import IncomeExpenses from "./Pages/IncomeExpenseList";
import PhoneScreen from "./Components/Screen";
import React from 'react';
import './App.css';
import AddBankAccountPage from './Pages/AddBankAccount';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 flex items-center justify-center">
      <PhoneScreen>
        <IncomeExpenses />
      </PhoneScreen>
    <div className="App">
      <AddBankAccountPage /> {/* แสดง AddBankAccount */}
    </div>
    </div>
  );
};

export default App;
