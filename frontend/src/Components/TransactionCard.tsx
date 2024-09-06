import React, { useState } from 'react';

type TransactionCardProps = {
  type: string;
  description: string;
  amount: number;
  date: string;
  time: string;
  fromAccount: string;
  endBalance: number;
};

const TransactionCard: React.FC<TransactionCardProps> = ({
  type,
  description,
  amount,
  date,
  time,
  fromAccount,
  endBalance,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <div className="bg-white p-4 rounded-lg mb-2 shadow-lg">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="mr-4">
            {type === 'Taxi' && <span className="text-blue-500">🚕</span>}
            {type === 'Insurance' && <span className="text-red-500">🛡️</span>}
            {type === 'Salary' && <span className="text-green-500">💰</span>}
          </div>
          <div>
            <p className="text-lg font-semibold">{description}</p>
            <p className="text-xs text-gray-500">
              {date} {time}
            </p>
          </div>
        </div>
        <div className={type === 'Salary' ? 'text-green-500' : 'text-red-500'}>
          {type === 'Salary' ? `+฿${amount.toLocaleString()}` : `-฿${amount.toLocaleString()}`}
        </div>
      </div>
      <div className="flex justify-between mt-2">
        <button
          className="text-blue-500 text-xs"
          onClick={toggleExpand}
        >
          {isExpanded ? 'Hide Details' : 'More Details'}
        </button>
        <div>
          <button
            className="text-gray-400"
            onClick={toggleExpand}
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className="mt-2 text-sm text-gray-700">
          <p>From: {fromAccount}</p>
          <p>End Balance: ฿{endBalance.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
};

export default TransactionCard;
