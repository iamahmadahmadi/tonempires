// Telegram Stars invoices are intentionally disabled until a real invoice-link
// flow and server-side successful_payment verification are installed. Never
// return a fake share URL as if it were a payable invoice.
export default async function () {
  return {
    success: false,
    error: 'star_payments_not_configured',
  };
}
