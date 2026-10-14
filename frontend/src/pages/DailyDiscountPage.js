import React from 'react';
import { useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import DailyDiscount from './DailyDiscount';
import { useContext } from 'react';
import { DiscountContext } from '../DiscountContext';

/**
 * Full page wrapper around the DailyDiscount modal.  When a user navigates
 * to the `/daily-discount` route from the Tasks page they are presented
 * with a standalone screen containing the daily secret challenge.  This
 * component wires up the required props for the underlying modal:
 *  - `isOpen` is set to true so the modal renders immediately.
 *  - `onClose` navigates back to the tasks page when the user closes the
 *    challenge without completing it or after it finishes.
 *  - `onVerify` receives the discount from the server upon correct entry
 *    of the secret word and stores it in the DiscountContext.  The
 *    discount returned by the backend is a whole number percentage (e.g.
 *    `20` for 20 % off) so we convert it to a decimal fraction (0.20)
 *    before saving.
 */
const DailyDiscountPage = () => {
  const navigate = useNavigate();
  const { setDiscount } = useContext(DiscountContext);

  // Obtain the Telegram user ID from the WebApp environment.  During
  // development outside of Telegram a dummy ID is used.
  const telegramId = WebApp.initDataUnsafe?.user?.id;

  const handleClose = () => {
    navigate('/tasks');
  };

  const handleVerify = (discountPercentage) => {
    // The API returns the discount as a percentage integer (e.g. 20).  Convert
    // to a decimal fraction before storing in context.  A 0 % discount
    // results in the value 0 which clears any previous discount.
    const parsed = parseFloat(discountPercentage);
    if (!isNaN(parsed) && parsed > 0) {
      setDiscount(parsed / 100);
    } else {
      setDiscount(0);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <DailyDiscount
        isOpen={true}
        onClose={handleClose}
        onVerify={handleVerify}
        telegramId={telegramId}
      />
    </div>
  );
};

export default DailyDiscountPage;