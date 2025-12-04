import React from "react";

const StockStatus = ({ remaining, isSelected, isDisabled }) => {
  if (isDisabled) {
    return null;
  }

  return (
    <div
      style={{
        fontSize: "11px",
        color: isSelected
          ? "#FFD700" // Gold color for selected
          : "#28a745", // Green for available
        fontWeight: "500",
      }}
    >
      เหลือ {Math.max(0, remaining)} ตัว
    </div>
  );
};

export default StockStatus;
