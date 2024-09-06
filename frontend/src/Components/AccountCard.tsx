// src/components/AccountCard.tsx
import React from 'react';

type AccountCardProps = {
  accountName: string;
  balance: number;
  lastUpdated: string;
};

const AccountCard: React.FC<AccountCardProps> = ({ accountName, balance, lastUpdated }) => {
  return (
    <div className="bg-blue-300 text-white p-4 rounded-lg mb-4">
      <h3 className="text-xl font-semibold">{accountName}</h3>
      <p className="text-3xl font-bold">{balance.toLocaleString()} ฿</p>
      <p className="text-sm">{lastUpdated}</p>
    </div>
  );
};

export default AccountCard;
