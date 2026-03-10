export const formatCurrency = (amount, currency = "USD") => {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount || 0);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

export const getMonthName = (month) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[(month || 1) - 1];
};

export const getCurrentMonth = () => new Date().getMonth() + 1;
export const getCurrentYear = () => new Date().getFullYear();

export const calcPercentChange = (current, previous) => {
  if (!previous) return current > 0 ? 100 : 0;
  return ((current - previous) / previous * 100).toFixed(1);
};
