import React, { useState } from 'react';
import { X, DollarSign, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { Product } from '../types';
import { useMessaging } from '../hooks/useMessaging';
import { useAuth } from '../hooks/useAuth';
import { useTerms } from '../hooks/useTerms';
import { logger } from '../utils/logger';

interface MakeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export function MakeOfferModal({ isOpen, onClose, product }: MakeOfferModalProps) {
  const [offerAmount, setOfferAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { createConversation, sendMessage } = useMessaging();
  const { user } = useAuth();
  const { needsTermsAcceptance } = useTerms();

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !user) return;

    if (needsTermsAcceptance) {
      setError('You must accept the Terms of Service before making offers.');
      return;
    }

    const offer = parseFloat(offerAmount);
    if (isNaN(offer) || offer <= 0) {
      setError('Please enter a valid offer amount');
      return;
    }

    if (offer >= product.price) {
      setError('Offer must be less than the listed price');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const conversationId = await createConversation(product.seller.id);
      
      const offerMessage = `Hi! I'm interested in your "${product.title}". I'd like to make an offer of ${offer} ${product.currency} (listed at ${product.price} ${product.currency}).${message ? `\n\nAdditional message: ${message}` : ''}`;
      
      await sendMessage(conversationId, offerMessage);
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);
    } catch (error) {
      logger.error('Failed to send offer', 'MakeOfferModal', error);
      setError('Failed to send offer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setOfferAmount('');
    setMessage('');
    setError('');
    setSuccess(false);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  if (!isOpen || !product) return null;

  const maxOffer = product.price * 0.9; // Max 90% of listed price
  const minOffer = product.price * 0.3; // Min 30% of listed price

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="luxe-glass-strong rounded-3xl border border-white/10 w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-luxe-gold" />
            <h2 className="text-xl font-black text-gray-200 uppercase">MAKE OFFER</h2>
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
              <h3 className="text-xl font-black text-green-400 mb-2 uppercase">OFFER SENT!</h3>
              <p className="text-gray-400 font-bold uppercase">Your offer has been sent to the seller</p>
            </div>
          ) : (
            <>
              {/* Product Summary */}
              <div className="luxe-glass rounded-2xl p-4 mb-6 border border-white/10">
                <div className="flex items-start space-x-4">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-16 h-16 object-cover rounded-xl"
                  />
                  <div className="flex-1">
                    <h3 className="text-gray-200 font-black uppercase line-clamp-2 mb-2">
                      {product.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm font-bold uppercase">
                        BY {product.seller.name}
                      </span>
                      <span className="text-xl font-black text-luxe-gold uppercase">
                        {product.price} GHETTO
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Offer Form */}
              <form onSubmit={handleSubmitOffer} className="space-y-4">
                <div>
                  <label className="block text-gray-200 font-black mb-2 uppercase">Your Offer (GHETTO)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={minOffer}
                    max={maxOffer}
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-luxe-gold focus:border-transparent text-gray-200 placeholder-gray-500 font-bold text-center"
                    placeholder={`${minOffer.toFixed(2)} - ${maxOffer.toFixed(2)}`}
                    required
                  />
                  <p className="text-gray-500 text-xs mt-1 font-bold uppercase text-center">
                    SUGGESTED RANGE: {minOffer.toFixed(2)} - {maxOffer.toFixed(2)} GHETTO
                  </p>
                </div>

                <div>
                  <label className="block text-gray-200 font-black mb-2 uppercase">Message (Optional)</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-luxe-gold focus:border-transparent text-gray-200 placeholder-gray-500 resize-none font-bold"
                    placeholder="Add a personal message to your offer..."
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-sm font-bold">{error}</p>
                  </div>
                )}

                {/* Info Box */}
                <div className="luxe-glass opacity-50 rounded-2xl p-4 border border-white/10">
                  <h4 className="text-gray-200 font-black mb-2 uppercase text-sm">How it works:</h4>
                  <ul className="space-y-1 text-gray-400 text-xs font-bold uppercase">
                    <li>• YOUR OFFER WILL BE SENT TO THE SELLER</li>
                    <li>• SELLER CAN ACCEPT, DECLINE, OR COUNTER</li>
                    <li>• YOU'LL BE NOTIFIED OF THEIR RESPONSE</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !user}
                  className="w-full py-4 bg-luxe-gold hover:shadow-neon-blue disabled:luxe-glass text-black font-black rounded-2xl transition-all duration-200 flex items-center justify-center space-x-2 uppercase active:btn-neon-active"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>{user ? 'SEND OFFER' : 'LOGIN TO MAKE OFFER'}</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}