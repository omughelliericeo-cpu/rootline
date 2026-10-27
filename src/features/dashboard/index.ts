// Public surface of the dashboard feature. The page is src/app/(producer)/dashboard/page.tsx.
export { CertificatesCard, RecentBatchesCard, ScanChartCard, StatCards, TopBatchesCard } from "./components/DashboardCards";
export { getDashboard, type DashboardData } from "./server/queries";
export { certificatesNeedingAttention, daysLeftLabel, greeting } from "./service";
