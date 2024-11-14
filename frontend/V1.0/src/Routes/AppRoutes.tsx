import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import IncomeExpenses from "../Pages/IncomeExpenseList";
import AddBankAccountPage from '../Pages/AddBankAccount';
import HomePage from '../Pages/HomePage';
const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/IncomeExpenses" element={<IncomeExpenses />} />
        <Route path="/AddBankAccount" element={<AddBankAccountPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
