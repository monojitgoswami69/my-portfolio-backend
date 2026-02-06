import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Mail, Check, X, Trash2, Filter, RefreshCw, Clock, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../utils/helpers';

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } }
};

const statusConfig = {
  new: { label: 'New', color: 'blue', icon: Clock },
  done: { label: 'Done', color: 'green', icon: CheckCircle },
  dismissed: { label: 'Dismissed', color: 'gray', icon: XCircle }
};

export default function CommunicationPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const { showSuccess, showError } = useToast();

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = filter === 'all' ? '' : filter;
      const response = await api.communication.getAll(statusParam);
      setSubmissions(response.records || []);
    } catch (err) {
      showError('Failed to load submissions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter, showError]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  useEffect(() => {
    const handleRefresh = () => loadSubmissions();
    window.addEventListener('refresh-communication', handleRefresh);
    return () => window.removeEventListener('refresh-communication', handleRefresh);
  }, [loadSubmissions]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.communication.updateStatus(id, status);
      showSuccess(`Marked as ${status}`);
      await loadSubmissions();
    } catch (err) {
      showError(`Failed to mark as ${status}`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;

    try {
      await api.communication.delete(id);
      showSuccess('Submission deleted');
      await loadSubmissions();
    } catch (err) {
      showError('Failed to delete submission');
    }
  };

  const getStats = () => {
    return {
      total: submissions.length,
      new: submissions.filter(s => s.status === 'new').length,
      done: submissions.filter(s => s.status === 'done').length,
      dismissed: submissions.filter(s => s.status === 'dismissed').length
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        className="w-full h-full min-h-[calc(100vh-200px)] flex items-center justify-center"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 bg-primary-600 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <span className="text-neutral-600 font-medium">Loading submissions...</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="w-full h-full"
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Communication</h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-1">
            Manage contact form submissions from your portfolio
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="text-2xl font-bold text-neutral-900">{stats.total}</div>
            <div className="text-xs text-neutral-600">Total</div>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
            <div className="text-xs text-blue-600">New</div>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-200 p-4">
            <div className="text-2xl font-bold text-green-600">{stats.done}</div>
            <div className="text-xs text-green-600">Done</div>
          </div>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-600">{stats.dismissed}</div>
            <div className="text-xs text-gray-600">Dismissed</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2">
          {['all', 'new', 'done', 'dismissed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                filter === status
                  ? "bg-primary-600 text-white"
                  : "bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
              )}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Submissions List */}
        <div className="space-y-3">
          {submissions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-neutral-200">
              <Mail className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-600">No submissions found</p>
            </div>
          ) : (
            <AnimatePresence>
              {submissions.map((submission) => {
                const StatusIcon = statusConfig[submission.status].icon;
                const isExpanded = expandedId === submission.id;

                return (
                  <motion.div
                    key={submission.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:border-neutral-300 transition-colors"
                  >
                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-neutral-900 truncate">
                              {submission.name}
                            </h3>
                            <span className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                              submission.status === 'new' && "bg-blue-100 text-blue-700",
                              submission.status === 'done' && "bg-green-100 text-green-700",
                              submission.status === 'dismissed' && "bg-gray-100 text-gray-700"
                            )}>
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig[submission.status].label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-neutral-600">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {submission.email}
                            </span>
                            <span>
                              {new Date(submission.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : submission.id)}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          {isExpanded ? 'Hide' : 'Show'}
                        </button>
                      </div>

                      {/* Message Preview */}
                      {!isExpanded && (
                        <p className="text-sm text-neutral-600 line-clamp-2 mb-3">
                          {submission.message}
                        </p>
                      )}

                      {/* Expanded Message */}
                      {isExpanded && (
                        <div className="bg-neutral-50 rounded-lg p-3 mb-3">
                          <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                            {submission.message}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {submission.status !== 'done' && (
                          <button
                            onClick={() => handleStatusUpdate(submission.id, 'done')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                          >
                            <Check className="w-4 h-4" />
                            Mark Done
                          </button>
                        )}
                        {submission.status !== 'dismissed' && (
                          <button
                            onClick={() => handleStatusUpdate(submission.id, 'dismissed')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                          >
                            <X className="w-4 h-4" />
                            Dismiss
                          </button>
                        )}
                        {submission.status !== 'new' && (
                          <button
                            onClick={() => handleStatusUpdate(submission.id, 'new')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Mark New
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(submission.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium ml-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  );
}
