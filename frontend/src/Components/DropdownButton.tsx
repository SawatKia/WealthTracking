import React, { useState } from 'react';

type DropdownButtonProps = {
  onSelect: (type: 'Income' | 'Expense') => void;
  selectedType: 'Income' | 'Expense';
};

const DropdownButton: React.FC<DropdownButtonProps> = ({ onSelect, selectedType }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (option: 'Income' | 'Expense') => {
    onSelect(option);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className={`w-50 px-4 py-2 rounded-lg ${
          selectedType === 'Income' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}
      >
        {selectedType}
      </button>
      {isOpen && (
        <div className="absolute mt-2 w-full rounded-lg shadow-lg bg-white border border-gray-200">
          <div
            className="px-4 py-2 hover:bg-green-100 cursor-pointer"
            onClick={() => handleSelect('Income')}
          >
            Income
          </div>
          <div
            className="px-4 py-2 hover:bg-red-100 cursor-pointer"
            onClick={() => handleSelect('Expense')}
          >
            Expense
          </div>
        </div>
      )}
    </div>
  );
};

export default DropdownButton;
