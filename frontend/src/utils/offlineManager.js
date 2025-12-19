/**
 * Utility to manage offline report storage and synchronization
 */

const OFFLINE_STORAGE_KEY = 'reportpilot_pending_reports';

export const saveReportOffline = (reportData) => {
    try {
        const existing = JSON.parse(localStorage.getItem(OFFLINE_STORAGE_KEY) || '[]');
        const newEntry = {
            ...reportData,
            offline_id: Date.now(),
            queued_at: new Date().toISOString()
        };
        existing.push(newEntry);
        localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(existing));
        return true;
    } catch (e) {
        console.error("Failed to save report offline", e);
        return false;
    }
};

export const getPendingReports = () => {
    try {
        return JSON.parse(localStorage.getItem(OFFLINE_STORAGE_KEY) || '[]');
    } catch (e) {
        return [];
    }
};

export const removePendingReport = (offlineId) => {
    try {
        const existing = JSON.parse(localStorage.getItem(OFFLINE_STORAGE_KEY) || '[]');
        const filtered = existing.filter(r => r.offline_id !== offlineId);
        localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) { }
};

export const syncOfflineReports = async (session, API_URL) => {
    const pending = getPendingReports();
    if (pending.length === 0) return { success: 0, failed: 0 };

    let successCount = 0;
    let failCount = 0;

    for (const report of pending) {
        try {
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session?.access_token}`
            };

            const res = await fetch(`${API_URL}/reports/generate`, {
                method: "POST",
                headers,
                body: JSON.stringify(report),
            });

            if (res.ok) {
                removePendingReport(report.offline_id);
                successCount++;
            } else {
                failCount++;
            }
        } catch (err) {
            failCount++;
        }
    }

    return { success: successCount, failed: failCount };
};
