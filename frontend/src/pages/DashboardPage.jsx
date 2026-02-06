import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { Modal } from '../components/UI/Modal';

const generateFallbackWeeklyData = () => {
  const data = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    data.push({
      date: `${day} ${month}`,
      fullDate: date.toISOString(),
      queries: 0,
    });
  }
  return data;
};

const formatChartDate = (dateStr) => {
  if (!dateStr) return '';
  
  // Handle DD/MM/YYYY format
  if (typeof dateStr === 'string' && dateStr.includes('/')) {
    const [d, m, y] = dateStr.split('/');
    const dateObj = new Date(y, m - 1, d);
    if (!isNaN(dateObj.getTime())) {
      return `${dateObj.getDate()} ${dateObj.toLocaleDateString('en-US', { month: 'short' })}`;
    }
  }
  
  // Handle ISO or other standard formats
  const dateObj = new Date(dateStr);
  if (!isNaN(dateObj.getTime())) {
    return `${dateObj.getDate()} ${dateObj.toLocaleDateString('en-US', { month: 'short' })}`;
  }
  
  return dateStr;
};

function MiniBarChart({ data }) {
  const maxValue = Math.max(...data.map(d => d.queries));

  return (
    <div className="flex items-end justify-between gap-1 sm:gap-2 h-32 sm:h-40">
      {data.map((item, index) => {
        const height = maxValue > 0 ? (item.queries / maxValue) * 100 : 0;
        return (
          <div
            key={index}
            className="flex-1 flex flex-col items-center gap-1 h-full min-w-0 group"
          >
            <span className="text-xs font-semibold text-neutral-600">{item.queries}</span>
            <div className="w-full flex-1 relative">
              <div className="absolute inset-0 bg-neutral-100 rounded-sm overflow-hidden">
                <motion.div
                  className="w-full bg-primary-500 rounded-sm absolute bottom-0 group-hover:bg-primary-600 transition-colors"
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}
                  style={{ minHeight: '4px' }}
                />
              </div>
            </div>
            <span className="text-xs text-neutral-500 font-medium text-center truncate w-full">{item.date}</span>
          </div>
        );
      })}
    </div>
  );
}

function ActivityItem({ action, timestamp, actor, index, meta }) {
  // Format timestamp to IST
  const formatToIST = (ts) => {
    const date = new Date(ts);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format action text with filename if available
  const formatAction = () => {
    const filename = meta?.filename;
    
    // Map backend action names to user-friendly text
    const actionMap = {
      // Auth actions
      'login': 'Logged in',
      'logout': 'Logged out',
      
      // Resource actions
      'projects_updated': 'Updated projects',
      'contacts_updated': 'Updated contacts',
      'knowledge_updated': 'Updated knowledge base',
      'system_instructions_updated': 'Updated system instructions',
      
      // Document actions (with filename)
      'document_uploaded': filename ? `Uploaded: ${filename}` : 'Uploaded document',
      'document_archived': filename ? `Archived: ${filename}` : 'Archived document',
      'document_restored': filename ? `Restored: ${filename}` : 'Restored document',
      'document_deleted': filename ? `Deleted: ${filename}` : 'Deleted document',
      'document_edited': filename ? `Edited: ${filename}` : 'Edited document',
      'document_downloaded': filename ? `Downloaded: ${filename}` : 'Downloaded document',
    };

    return actionMap[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <motion.div
      className="flex items-start gap-3 py-3 border-b border-neutral-200 last:border-0 group"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
    >
      <div className="w-8 h-8 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0">
        <Clock className="w-4 h-4 text-primary-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-neutral-900 tracking-tight">{formatAction()}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-semibold text-primary-600">{actor}</span>
          <span className="text-xs text-neutral-400">•</span>
          <span className="text-[11px] text-neutral-500 tracking-wide">{formatToIST(timestamp)} IST</span>
        </div>
      </div>
    </motion.div>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex items-end justify-between gap-2 h-36" role="status" aria-label="Loading chart">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full">
          <div className="h-3 w-10 bg-neutral-100 rounded animate-pulse" />
          <div className="w-full flex-1 bg-neutral-100 rounded animate-pulse" />
          <div className="h-3 w-8 bg-neutral-100 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="Loading activity">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 py-3 border-b border-neutral-200 last:border-0">
          <div className="w-8 h-8 bg-neutral-100 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 bg-neutral-100 rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="h-3 w-16 bg-neutral-100 rounded animate-pulse" />
              <div className="h-3 w-12 bg-neutral-100 rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3, staggerChildren: 0.1 } }
};

const cardVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function DashboardPage() {
  const [weeklyData, setWeeklyData] = useState(generateFallbackWeeklyData());
  const [activityData, setActivityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllLogs, setShowAllLogs] = useState(false);

  const fetchDashboardData = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const [weeklyResponse, activityResponse] = await Promise.all([
        api.dashboard.getWeekly(),
        api.dashboard.getActivity(10)
      ]);

      // Format weekly data from API response
      let formattedWeeklyData = generateFallbackWeeklyData();
      if (weeklyResponse?.weekly && weeklyResponse.weekly.length > 0) {
        // New format: weekly metrics from dedicated collection
        formattedWeeklyData = weeklyResponse.weekly.map(item => ({
          date: formatChartDate(item.date || item.day),
          fullDate: item.fullDate || item.date || new Date().toISOString(),
          queries: item.queries || item.count || item.hits || 0
        }));
      } else if (weeklyResponse?.weeklyActivity && weeklyResponse.weeklyActivity.length > 0) {
        // Legacy format support
        formattedWeeklyData = weeklyResponse.weeklyActivity.map(item => ({
          date: formatChartDate(item.date || item.day),
          fullDate: item.date || new Date().toISOString(),
          queries: item.count || item.queries || 0
        }));
      } else if (weeklyResponse?.data && weeklyResponse.data.length > 0) {
        formattedWeeklyData = weeklyResponse.data.map(item => ({
          date: formatChartDate(item.date),
          fullDate: item.date,
          queries: item.queries || item.count || 0
        }));
      }
      setWeeklyData(formattedWeeklyData);

      // Format activity data - backend returns { activity: [...] }
      let formattedActivity = [];
      if (activityResponse?.activity) {
        formattedActivity = activityResponse.activity;
      } else if (activityResponse?.activities) {
        formattedActivity = activityResponse.activities;
      } else if (Array.isArray(activityResponse)) {
        formattedActivity = activityResponse;
      }
      setActivityData(formattedActivity);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard data');
      // Use fallback data
      const fallbackWeekly = generateFallbackWeeklyData();
      setWeeklyData(fallbackWeekly);
      setActivityData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fire and forget; UI already shows fallback
    fetchDashboardData();
  }, []);

  // Listen for data changes from operations and refresh dashboard
  useEffect(() => {
    const handleDataChange = (e) => {
      // Refresh dashboard activity logs and metrics for any data change
      fetchDashboardData();
    };

    window.addEventListener('data-changed', handleDataChange);
    return () => window.removeEventListener('data-changed', handleDataChange);
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-neutral-600">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-2 sm:space-y-3 md:space-y-4"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      {/* Page Header with Refresh Button */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <button
          onClick={() => fetchDashboardData(true)}
          disabled={loading}
          className="p-2 text-neutral-600 hover:text-neutral-900 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {/* Weekly Activity Chart */}
      <motion.div
        className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 md:p-6"
        variants={cardVariants}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-bold text-neutral-900 tracking-tight">Weekly Activity</h3>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-primary-500 rounded-full" />
            <span className="text-neutral-600 text-[13px]">Queries</span>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32 sm:h-40">
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 bg-primary-600 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <span className="text-sm text-neutral-500">Loading activity...</span>
            </div>
          </div>
        ) : (
          <MiniBarChart data={weeklyData} />
        )}
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 md:p-6"
        variants={cardVariants}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-neutral-900 tracking-tight">Recent Activity</h2>
          {activityData.length > 5 && (
            <button
              onClick={() => setShowAllLogs(true)}
              className="text-[13px] text-primary-600 hover:text-primary-700 font-semibold"
            >
              See More &gt;
            </button>
          )}
        </div>
        <div>
          {loading ? (
            <ActivitySkeleton />
          ) : activityData.length > 0 ? (
            activityData.slice(0, 5).map((activity, index) => (
              <ActivityItem
                key={activity.id || index}
                action={activity.action || activity.type || activity.message}
                timestamp={activity.timestamp || activity.created_at}
                actor={activity.actor || activity.user_id || activity.user || 'System'}
                meta={activity.meta || activity.details || {}}
                index={index}
              />
            ))
          ) : (
            <p className="text-neutral-500 text-center py-8">No recent activity</p>
          )}
        </div>
      </motion.div>

      {/* All Logs Modal */}
      <Modal
        isOpen={showAllLogs}
        onClose={() => setShowAllLogs(false)}
        title="All Activity Logs"
        size="large"
      >
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          {activityData.map((activity, index) => (
            <ActivityItem
              key={activity.id || index}
              action={activity.action || activity.type || activity.message}
              timestamp={activity.timestamp || activity.created_at}
              actor={activity.actor || activity.user_id || activity.user || 'System'}
              meta={activity.meta || activity.details || {}}
              index={index}
            />
          ))}
        </div>
      </Modal>
    </motion.div>
  );
}
