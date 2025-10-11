import axios from './axiosConfig';
import { getAssets } from './assets';
import { getAllocations } from './allocations';
import { getMaintenanceRecords } from './maintenance';

export const getAssetCounts = async () => {
  const [assets, allocations, maintenanceRecords] = await Promise.all([
    getAssets(),
    getAllocations(),
    getMaintenanceRecords(),
  ]);

  const total = assets.length;
  const allocated = allocations.filter(a => !a.actual_return_date).length;
  const underMaintenance = maintenanceRecords.filter(m => !m.end_date || new Date(m.end_date) > new Date()).length;

  return {
    total,
    allocated,
    underMaintenance,
  };
};

export const getMaintenanceTrend = async () => {
  const maintenanceRecords = await getMaintenanceRecords();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const months = [];
  for (let i = 0; i < 6; i++) {
    const date = new Date(sixMonthsAgo);
    date.setMonth(sixMonthsAgo.getMonth() + i);
    months.push({
      month: date.toLocaleString('default', { month: 'short' }),
      repairs: 0,
    });
  }

  maintenanceRecords.forEach(record => {
    const startDate = new Date(record.start_date);
    if (startDate >= sixMonthsAgo) {
      const monthIndex = startDate.getMonth() - sixMonthsAgo.getMonth();
      if (monthIndex >= 0 && monthIndex < 6) {
        months[monthIndex].repairs += 1;
      }
    }
  });

  return months;
};