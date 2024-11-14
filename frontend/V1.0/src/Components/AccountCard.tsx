import React from 'react';
import { useSwipeable } from 'react-swipeable';

// Define types for props
type AccountCardProps = {
  accountName: string;
  balance: number;
  lastUpdated: string;
  totalAccounts: number;
  currentIndex: number;
  onSwipe: (direction: string) => void;
};

// CircleIndicator component as part of AccountCard
const CircleIndicator: React.FC<{ currentIndex: number; total: number }> = ({ currentIndex, total }) => {
  return (
    <div className="flex justify-center space-x-2 mt-2">
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={`w-2 h-2 rounded-full ${
            index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
          }`}
        ></div>
      ))}
    </div>
  );
};

const AccountCard: React.FC<AccountCardProps> = ({
  accountName,
  balance,
  lastUpdated,
  totalAccounts,
  currentIndex,
  onSwipe,
}) => {
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => onSwipe('Left'),
    onSwipedRight: () => onSwipe('Right'),
  });

  return (
    <div className="relative bg-gradient-to-b from-[#4957AA] to-[#7F8CD9] p-4 rounded-lg shadow-lg text-white">
      <div {...swipeHandlers} className="relative z-10">
        <div className="text-left">
          <h3 className="text-xl font-bold">{accountName}</h3>
          <p className="text-lg">฿{balance.toLocaleString()}</p>
          <p className="text-sm">Last Updated: {lastUpdated}</p>
        </div>
      </div>
      {/* Position the indicator outside the card */}
      <div className="absolute bottom-[-30px] left-1/2 transform -translate-x-1/2">
        <CircleIndicator currentIndex={currentIndex} total={totalAccounts} />
      </div>
    </div>
  );
};

export default AccountCard;
