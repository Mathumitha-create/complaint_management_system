// Central API base URL for frontend fetches.
// Default to the Render backend URL used in deployment. Can be overridden
// by setting REACT_APP_API_BASE_URL in your hosting environment (e.g. Vercel).
const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  "https://complaint-management-system-qo5y.onrender.com";

export default API_BASE;
