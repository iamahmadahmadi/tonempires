import React, { createContext, useState, useEffect } from 'react';

/**
 * DiscountContext stores the current discount percentage for the logged‑in
 * user.  A value of 0 means no discount; 0.5 means 50% off; 0.99 means 99% off.
 * The context persists the value to localStorage so a page refresh does not
 * lose the discount within the same day.  In a production implementation
 * discounts would typically be stored server‑side and tied to a user’s
 * session or account rather than local storage.
 */
export const DiscountContext = createContext({ discount: 0, setDiscount: () => {} });

export const DiscountProvider = ({ children }) => {
  const [discount, setDiscount] = useState(0);

  // Load any stored discount from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('daily_discount');
    if (stored) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed)) {
        setDiscount(parsed);
      }
    }
  }, []);

  // Save discount to localStorage whenever it changes
  const updateDiscount = (value) => {
    setDiscount(value);
    if (value > 0) {
      localStorage.setItem('daily_discount', value.toString());
    } else {
      localStorage.removeItem('daily_discount');
    }
  };

  return (
    <DiscountContext.Provider value={{ discount, setDiscount: updateDiscount }}>
      {children}
    </DiscountContext.Provider>
  );
};