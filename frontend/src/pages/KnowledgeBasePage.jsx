import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, User, Code, Folder, Mail, FileText, Save, Check, RefreshCw } from 'lucide-react';
import { cn } from '../utils/helpers';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { cachedApiCall, clearCached } from '../utils/sessionCache';

// --- Default Content ---
const DEFAULT_CONTENT = {
  'about-me': '',
  'tech-stack': '',
  'projects': '',
  'contacts': '',
  'miscellaneous': ''
};

// --- Expandable Section Component ---
const ExpandableSection = ({ title, icon: Icon, id, defaultOpen = false, content, onSave }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [text, setText] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Update local state if prop content changes (e.g. from upstream fetch)
  useEffect(() => {
    setText(content);
    setHasChanges(false);
  }, [content]);

  const handleChange = (e) => {
    setText(e.target.value);
    setHasChanges(e.target.value !== content);
  };

  const handleSave = async (e) => {
    e.stopPropagation(); // Prevent toggling accordion
    setIsSaving(true);
    await onSave(id, text);
    setIsSaving(false);
    setHasChanges(false);
  };

  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col h-auto transition-all duration-300">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-neutral-50 transition-colors cursor-pointer select-none"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isOpen ? 'bg-primary-50 text-primary-600' : 'bg-neutral-100 text-neutral-600'}`}>
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && isOpen && (
            <span className="text-xs text-amber-500 font-medium animate-pulse">Unsaved changes</span>
          )}
          {isOpen ? (
            <ChevronDown className="w-5 h-5 text-neutral-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-neutral-400" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: '500px', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="border-t border-neutral-100 bg-neutral-50 flex flex-col"
          >
            {/* Toolbar */}
            <div className="px-4 py-2 bg-neutral-100 border-b border-neutral-200 flex items-center justify-between flex-shrink-0">
              <span className="text-xs text-neutral-500 font-mono">Markdown / Text</span>
              <button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  hasChanges
                    ? "bg-primary-600 text-white hover:bg-primary-700 shadow-sm"
                    : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                )}
              >
                {isSaving ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    {hasChanges ? <Save className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>

            {/* Editor Area */}
            <div className="flex-1 relative min-h-0 bg-white">
              <textarea
                value={text}
                onChange={handleChange}
                className="absolute inset-0 w-full h-full p-4 resize-none focus:outline-none font-mono text-sm leading-relaxed text-neutral-800 bg-white placeholder-neutral-400"
                spellCheck="false"
                placeholder={`Enter content for ${title}...`}
              />
            </div>

            {/* Footer Status */}
            <div className="px-4 py-1.5 bg-neutral-50 border-t border-neutral-200 text-[10px] text-neutral-400 flex justify-between flex-shrink-0">
              <span>{text.length} characters</span>
              <span className="font-mono">ID: {id}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function KnowledgeBasePage() {
  const [sectionContent, setSectionContent] = useState(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  // Fetch all categories on mount
  useEffect(() => {
    loadAllCategories();
  }, []);

  const loadAllCategories = async (forceRefresh = false) => {
    setLoading(true);
    try {
      if (forceRefresh) {
        clearCached('knowledge_base_all');
      }
      
      const data = await cachedApiCall('knowledge_base_all', () => api.chatbotKnowledge.getAll(), forceRefresh);
      if (data.status === 'success' && data.categories) {
        const content = {};
        for (const [key, value] of Object.entries(data.categories)) {
          content[key] = value.content || '';
        }
        setSectionContent(prev => ({ ...prev, ...content }));
      }
    } catch (err) {
      addToast({
        action: "Error",
        fileName: "Knowledge Base",
        status: 'error',
        message: err.message || "Failed to load knowledge base",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSection = async (id, newContent) => {
    try {
      await api.chatbotKnowledge.save(id, newContent);
      clearCached('knowledge_base_all'); // Clear cache after save
      setSectionContent(prev => ({
        ...prev,
        [id]: newContent
      }));

      addToast({
        action: "Saved",
        fileName: id,
        status: 'complete',
        message: "Section updated successfully",
      });
    } catch (err) {
      addToast({
        action: "Error",
        fileName: id,
        status: 'error',
        message: err.message || "Failed to save section",
      });
      throw err; // Re-throw to keep hasChanges state
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full min-h-[calc(100vh-200px)] flex items-center justify-center">
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
          <span className="text-neutral-600 font-medium">Loading knowledge base...</span>
        </div>
      </div>
    );
  }

  return (
    // Removed max-w-4xl to allow full width
    <div className="w-full h-full flex flex-col py-4 px-2 sm:px-6 overflow-y-auto">
      <div className="mb-6 flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Knowledge Base</h1>
          <p className="text-neutral-500">
            Manage your portfolio chatbot knowledge base.
          </p>
        </div>
        <button
          onClick={() => loadAllCategories(true)}
          disabled={loading}
          className="p-2 text-neutral-600 hover:text-neutral-900 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 space-y-2 pb-10">
        <ExpandableSection
          title="About Me"
          icon={User}
          id="about-me"
          defaultOpen={false}
          content={sectionContent['about-me']}
          onSave={handleSaveSection}
        />

        <ExpandableSection
          title="Tech Stack"
          icon={Code}
          id="tech-stack"
          content={sectionContent['tech-stack']}
          onSave={handleSaveSection}
        />

        <ExpandableSection
          title="Projects"
          icon={Folder}
          id="projects"
          content={sectionContent['projects']}
          onSave={handleSaveSection}
        />

        <ExpandableSection
          title="Contacts"
          icon={Mail}
          id="contacts"
          content={sectionContent['contacts']}
          onSave={handleSaveSection}
        />

        <ExpandableSection
          title="Miscellaneous"
          icon={FileText}
          id="miscellaneous"
          content={sectionContent['miscellaneous']}
          onSave={handleSaveSection}
        />
      </div>
    </div>
  );
}
