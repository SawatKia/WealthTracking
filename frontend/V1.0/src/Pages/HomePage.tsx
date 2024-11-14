import React from 'react';
import AccountCard from "../Components/AccountCard";

const accounts = [
  {
    name: "Account A",
    balance: 1000000,
    lastUpdated: "Today, 18:00 PM",
  },
  {
    name: "Account B",
    balance: 500000,
    lastUpdated: "Yesterday, 15:00 PM",
  },
]


const Home: React.FC = () => {
  return (
    <div className="w-full max-w-xl p-6 space-y-6 bg-white shadow-lg rounded-lg">
        
        <div className="text-center pb-4 border-b">
            <h1 className="text-lg font-semibold">Home</h1>
        </div>

  
        <div className="space-y-6">

            <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Account</h2>

                <div className="mb-10">
                {/* <AccountCard
                  accountName={accounts[currentAccountIndex].name}
                  balance={accounts[currentAccountIndex].balance}
                  lastUpdated={accounts[currentAccountIndex].lastUpdated}
                  totalAccounts={accounts.length}
                  currentIndex={currentAccountIndex}
                  onSwipe={handleSwipe}
                /> */}
              </div>
            </div>

          </div>
      </div>

    
  );
};

export default Home;