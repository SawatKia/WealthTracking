import React from 'react';
import './App.css';

import AppRoutes from './Routes/AppRoutes';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 flex items-center justify-center">
      <AppRoutes />
    </div>
  );
  // return (
    // <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 flex items-center justify-center">
  //   //   {/* <PhoneScreen> */}
  //   //     {/* <IncomeExpenses /> */}
  //   //   {/* </PhoneScreen> */}
  //   //   {/* <AddBankAccountPage /> */}
  //   // </div>
  // );
};

export default App;
