import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Save, Mail, Github, Linkedin, Twitter, RefreshCw } from 'lucide-react';
import { cn } from '../utils/helpers';

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } }
};

export default function ContactsPage() {
  const [contact, setContact] = useState({
    email: '',
    socials: {
      github: '',
      linkedin: '',
      twitter: ''
    }
  });
  const [originalContact, setOriginalContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToast();

  const hasUnsavedChanges = JSON.stringify(contact) !== JSON.stringify(originalContact);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const data = await api.contacts.get();
      const contactData = data.contact || {
        email: '',
        socials: {
          github: '',
          linkedin: '',
          twitter: ''
        }
      };
      
      // Ensure socials object has all required fields
      if (!contactData.socials) {
        contactData.socials = { github: '', linkedin: '', twitter: '' };
      }
      
      setContact(contactData);
      setOriginalContact(contactData);
    } catch (err) {
      showError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.contacts.save(contact);
      setOriginalContact(contact);
      showSuccess('Contacts saved successfully');
    } catch (err) {
      showError('Failed to save contacts');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailChange = (e) => {
    setContact({ ...contact, email: e.target.value });
  };

  const handleSocialChange = (platform, value) => {
    setContact({
      ...contact,
      socials: { ...(contact.socials || {}), [platform]: value }
    });
  };

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
          <span className="text-neutral-600 font-medium">Loading contacts...</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="w-full h-full flex flex-col py-4 px-2 sm:px-6 overflow-y-auto"
    >
      <div className="max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Contact Information</h1>
            <p className="text-neutral-500">
              Manage your contact details and social media links.
            </p>
          </div>
          <button
            onClick={() => loadContacts(true)}
            disabled={loading || saving}
            className="p-2 text-neutral-600 hover:text-neutral-900 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
          {/* Email */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
              <Mail className="w-4 h-4" />
              Email Address
            </label>
            <input
              type="email"
              value={contact.email}
              onChange={handleEmailChange}
              placeholder="your.email@example.com"
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Divider */}
          <div className="border-t border-neutral-200 my-6"></div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-700 mb-3">Social Links</h3>

            {/* GitHub */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-600 mb-2">
                <Github className="w-4 h-4" />
                GitHub
              </label>
              <input
                type="url"
                value={contact.socials?.github || ''}
                onChange={(e) => handleSocialChange('github', e.target.value)}
                placeholder="https://github.com/username"
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* LinkedIn */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-600 mb-2">
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </label>
              <input
                type="url"
                value={contact.socials?.linkedin || ''}
                onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Twitter */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-600 mb-2">
                <Twitter className="w-4 h-4" />
                Twitter
              </label>
              <input
                type="url"
                value={contact.socials?.twitter || ''}
                onChange={(e) => handleSocialChange('twitter', e.target.value)}
                placeholder="https://twitter.com/username"
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6 flex items-center justify-between">
            {hasUnsavedChanges && (
              <span className="text-xs text-amber-500 font-medium animate-pulse">
                Unsaved changes
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || saving}
              className={cn(
                "ml-auto flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                hasUnsavedChanges
                  ? "bg-primary-600 text-white hover:bg-primary-700 shadow-sm"
                  : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
              )}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
