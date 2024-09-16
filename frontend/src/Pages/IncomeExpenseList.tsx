import React, { useState } from "react";
import { useSwipeable } from "react-swipeable";
import TransactionCard from "../Components/TransactionCard";
import AccountCard from "../Components/AccountCard";
import DropdownButton from "../Components/DropdownButton";

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

const transactions = [
  {
    id: 1,
    category: "Taxi",
    description: "Taxi",
    amount: 500,
    type: "Expense",
    date: "22 Feb 2024",
    time: "15:00 PM",
    fromAccount: "Account A",
    endBalance: 999500,
  },
  {
    id: 2,
    category: "Insurance",
    description: "Insurance",
    amount: 10000,
    type: "Expense",
    date: "22 Feb 2024",
    time: "18:00 PM",
    fromAccount: "Account A",
    endBalance: 989500,
  },
  {
    id: 3,
    category: "Taxi",
    description: "Taxi",
    amount: 500,
    type: "Expense",
    date: "22 Feb 2024",
    time: "15:00 PM",
    fromAccount: "Account A",
    endBalance: 999000,
  },
  {
    id: 4,
    category: "Taxi",
    description: "Taxi",
    amount: 500,
    type: "Expense",
    date: "22 Feb 2024",
    time: "15:00 PM",
    fromAccount: "Account A",
    endBalance: 998500,
  },
  {
    id: 5,
    category: "Salary",
    description: "Salary",
    amount: 1000,
    type: "Income",
    date: "22 Feb 2024",
    time: "18:00 PM",
    fromAccount: "Account A",
    endBalance: 1000500,
  },
];

const IncomeExpenses: React.FC = () => {
  const [selectedType, setSelectedType] = useState<"Income" | "Expense">("Expense");
  const [currentAccountIndex, setCurrentAccountIndex] = useState(0);

  const filteredTransactions = transactions.filter((transaction) => {
    return transaction.type === selectedType;
  });

  const handleSwipe = (direction: string) => {
    if (direction === "Left") {
      setCurrentAccountIndex((prevIndex) =>
        (prevIndex + 1) % accounts.length
      );
    } else if (direction === "Right") {
      setCurrentAccountIndex((prevIndex) =>
        (prevIndex - 1 + accounts.length) % accounts.length
      );
    }
  };

  return (
    <div className="w-80 mx-auto bg-blue-50 p-4 rounded-lg shadow-lg h-full flex flex-col relative">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold">Income & Expenses</h2>
      </div>
      <div className="mb-10">
        <AccountCard
          accountName={accounts[currentAccountIndex].name}
          balance={accounts[currentAccountIndex].balance}
          lastUpdated={accounts[currentAccountIndex].lastUpdated}
          totalAccounts={accounts.length}
          currentIndex={currentAccountIndex}
          onSwipe={handleSwipe}
        />
      </div>
      <div className="mb-4">
        <DropdownButton
          onSelect={setSelectedType}
          selectedType={selectedType}
        />
      </div>
      <div className="flex-grow overflow-y-auto">
        {filteredTransactions.map((transaction) => (
          <TransactionCard
            key={transaction.id}
            type={transaction.type}
            category={transaction.category}
            description={transaction.description}
            amount={transaction.amount}
            date={transaction.date}
            time={transaction.time}
            fromAccount={transaction.fromAccount}
            endBalance={transaction.endBalance}
          />
        ))}
      </div>
      {/* Floating Button */}
      <div className="absolute bottom-4 right-4">
        <button className="bg-blue-500 text-white p-4 rounded-full shadow-lg">
          +
        </button>
      </div>
    </div>
  );
};

export default IncomeExpenses;