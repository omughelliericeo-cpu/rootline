// Public surface of the analytics feature: recording scans and counting them.
export { scansByDay, topBatchesByScans, totalScans, type BatchScanCount } from "./server/queries";
export { recordScan } from "./server/record-scan";
export { coarseLocation, fillDays, percentChange, scanSource, weekTotals, type CoarseLocation, type DayCount } from "./service";
