import * as repo from "./analytics.repository";

export function getOverview() {
  return repo.fetchOverviewCounts();
}

export function getRevenue() {
  return repo.fetchRevenueStats();
}

export function getUniversityBreakdown() {
  return repo.fetchUniversityBreakdown();
}

export function getRecentRegistrations() {
  return repo.fetchRecentRegistrations();
}

export async function getDashboard() {
  const [overview, revenue, universities, recentRegistrations] =
    await Promise.all([
      repo.fetchOverviewCounts(),
      repo.fetchRevenueStats(),
      repo.fetchUniversityBreakdown(),
      repo.fetchRecentRegistrations(),
    ]);

  return { overview, revenue, universities, recentRegistrations };
}
