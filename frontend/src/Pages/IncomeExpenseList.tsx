import React, { useState } from "react";
import TransactionCard from "../Components/TransactionCard";
import AccountCard from "../Components/AccountCard";
import DropdownButton from "../Components/DropdownButton";

const transactions = [
  {
    id: 1,
    type: "Taxi",
    description: "Taxi",
    amount: -500,
    date: "22 Feb 2024",
    time: "15:00 PM",
    fromAccount: "Account A",
    endBalance: 999500,
  },
  {
    id: 2,
    type: "Insurance",
    description: "Insurance",
    amount: -10000,
    date: "22 Feb 2024",
    time: "18:00 PM",
    fromAccount: "Account A",
    endBalance: 989500,
  },
  {
    id: 3,
    type: "Taxi",
    description: "Taxi",
    amount: -500,
    date: "22 Feb 2024",
    time: "15:00 PM",
    fromAccount: "Account A",
    endBalance: 999000,
  },
  {
    id: 4,
    type: "Taxi",
    description: "Taxi",
    amount: -500,
    date: "22 Feb 2024",
    time: "15:00 PM",
    fromAccount: "Account A",
    endBalance: 998500,
  },
  {
    id: 5,
    type: "Salary",
    description: "Salary",
    amount: 1000,
    date: "22 Feb 2024",
    time: "18:00 PM",
    fromAccount: "Account A",
    endBalance: 1000500,
  },
];

const IncomeExpenses: React.FC = () => {
  const [selectedType, setSelectedType] = useState<"Income" | "Expense">(
    "Expense"
  );

  const filteredTransactions = transactions.filter((transaction) => {
    if (selectedType === "Income") {
      return transaction.amount > 0;
    } else {
      return transaction.amount < 0;
    }
  });

  return (
    <div className="w-80 mx-auto bg-blue-50 p-4 rounded-lg shadow-lg h-full flex flex-col relative">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold">Income & Expenses</h2>
      </div>
      <AccountCard
        accountName="Account A"
        balance={1000000}
        lastUpdated="Today, 18:00 PM"
      />
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
        <button className="bg-purple-500 text-white p-4 rounded-full shadow-lg">
          +
        </button>
      </div>
    </div>
  );
};

export default IncomeExpenses;
