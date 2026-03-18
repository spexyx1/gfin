import React, { useState } from 'react';
import { X, Send, Mail, User, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

interface ContactFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactForm({ isOpen, onClose }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (!supabase) {
        throw new Error('Database not configured');
      }

      const { error: insertError } = await supabase
        .from('business_inquiries')
        .insert({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          subject: formData.subject.trim() || 'General Inquiry',
          message: formData.message.trim(),
          user_id: user?.id || null,
          status: 'pending',
        });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setFormData({ name: '', email: '', subject: '', message: '' });
        setSuccess(false);
      }, 3000);
    } catch (error) {
      logger.error('Failed to submit business inquiry', 'ContactForm', error);
      setError('Failed to send message. Please try again or email info@ghetto.finance directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', subject: '', message: '' });
    setError('');
    setSuccess(false);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="luxe-glass-strong rounded-3xl border border-white/10 w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-luxe-gold" />
            <h2 className="text-xl font-black text-white uppercase">Contact Us</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:luxe-glass rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-black text-green-400 mb-2 uppercase">Message Sent!</h3>
              <p className="text-gray-400 font-bold uppercase">We'll get back to you soon</p>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <p className="text-gray-400 text-sm font-medium">
                  Have questions or feedback? Send us a message and we'll respond as soon as possible.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-white font-black mb-2 uppercase">Name *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 luxe-glass border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-luxe-gold focus:border-transparent text-white placeholder-gray-500"
                      placeholder="Your name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white font-black mb-2 uppercase">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 luxe-glass border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-luxe-gold focus:border-transparent text-white placeholder-gray-500"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white font-black mb-2 uppercase">Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-luxe-gold focus:border-transparent text-white placeholder-gray-500"
                    placeholder="What's this about?"
                  />
                </div>

                <div>
                  <label className="block text-white font-black mb-2 uppercase">Message *</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-4 text-gray-500 w-5 h-5" />
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={4}
                      className="w-full pl-12 pr-4 py-3 luxe-glass border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-luxe-gold focus:border-transparent text-white placeholder-gray-500 resize-none"
                      placeholder="Tell us what's on your mind..."
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-sm font-bold">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-luxe-gold hover:bg-luxe-gold/80 disabled:luxe-glass text-black font-black rounded-2xl transition-all duration-200 flex items-center justify-center space-x-2 uppercase"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-500 text-sm">
                  Or email us directly at{' '}
                  <a href="mailto:info@ghetto.finance" className="text-luxe-gold hover:text-luxe-gold/80 transition-colors">
                    info@ghetto.finance
                  </a>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}