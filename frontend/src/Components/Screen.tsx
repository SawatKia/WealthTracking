import React from 'react';

type PhoneScreenProps = {
  children: React.ReactNode;
};

const PhoneScreen: React.FC<PhoneScreenProps> = ({ children }) => {
  return (
    <div className="w-[375px] h-[667px] bg-white rounded-lg shadow-2xl overflow-hidden">
      {children}
    </div>
  );
};

export default PhoneScreen;
