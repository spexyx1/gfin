import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Send, MessageCircle, User, Clock, Check, CheckCheck, Trash2, Package, Video, PhoneCall } from 'lucide-react';
import { useMessaging } from '../hooks/useMessaging';
import { useWeb3 } from '../hooks/useWeb3';
import { formatDistanceToNow } from 'date-fns';
import { logger } from '../utils/logger';

interface MessagingCenterProps {
  isOpen: boolean;
  onClose: () => void;
  initialConversationId?: string;
  onStartCall?: (conversationId: string) => void;
  activeCallConversationId?: string | null;
}

export function MessagingCenter({ isOpen, onClose, initialConversationId, onStartCall, activeCallConversationId }: MessagingCenterProps) {
  const { t } = useTranslation();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(initialConversationId || null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { 
    conversations, 
    sendMessage, 
    markAsRead, 
    getConversationMessages, 
    getUserInfo,
    deleteConversation 
  } = useMessaging();
  const { account } = useWeb3();

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const conversationMessages = selectedConversationId ? getConversationMessages(selectedConversationId) : [];

  useEffect(() => {
    if (selectedConversationId) {
      markAsRead(selectedConversationId);
    }
  }, [selectedConversationId, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId) return;

    try {
      await sendMessage(selectedConversationId, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      logger.error('Failed to send message', 'MessagingCenter', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-gray-200 w-full max-w-6xl h-[80vh] overflow-hidden flex shadow-2xl">
        {/* Conversations List */}
        <div className="w-1/3 border-r border-gray-100 flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium text-black">{t('messages.title')}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-600 text-lg mb-2 font-medium">{t('messages.noMessages')}</p>
                <p className="text-gray-500 text-sm leading-relaxed">Contact sellers to start chatting</p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {conversations
                  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                  .map((conversation) => {
                    const otherParticipant = conversation.participants.find(p => p !== account);
                    const userInfo = otherParticipant ? getUserInfo(otherParticipant) : null;
                    
                    return (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversationId(conversation.id)}
                        className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedConversationId === conversation.id
                            ? 'bg-gray-100 border border-gray-200'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                            {userInfo?.avatar ? (
                              <img src={userInfo.avatar} alt={userInfo.name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-black font-medium truncate">
                                {userInfo?.name || 'Unknown User'}
                              </h3>
                              {conversation.unreadCount > 0 && (
                                <span className="bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                  {conversation.unreadCount}
                                </span>
                              )}
                            </div>
                            {conversation.lastMessage && (
                              <p className="text-gray-600 text-sm truncate mt-1">
                                {conversation.lastMessage.content}
                              </p>
                            )}
                            <p className="text-gray-500 text-xs mt-1">
                              {conversation.lastMessage && formatDistanceToNow(conversation.lastMessage.timestamp, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                      {(() => {
                        const otherParticipant = selectedConversation.participants.find(p => p !== account);
                        const userInfo = otherParticipant ? getUserInfo(otherParticipant) : null;
                        return userInfo?.avatar ? (
                          <img src={userInfo.avatar} alt={userInfo.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-white" />
                        );
                      })()}
                    </div>
                    <div>
                      <h3 className="text-black font-medium">
                        {(() => {
                          const otherParticipant = selectedConversation.participants.find(p => p !== account);
                          const userInfo = otherParticipant ? getUserInfo(otherParticipant) : null;
                          return userInfo?.name || 'Unknown User';
                        })()}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        {selectedConversation.participants.find(p => p !== account)?.slice(0, 10)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {onStartCall && (
                      <button
                        onClick={() => selectedConversationId && onStartCall(selectedConversationId)}
                        disabled={activeCallConversationId === selectedConversationId}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          activeCallConversationId === selectedConversationId
                            ? 'bg-green-100 text-green-700 cursor-default'
                            : 'bg-black text-white hover:luxe-glass'
                        }`}
                        title="Start video call"
                      >
                        {activeCallConversationId === selectedConversationId ? (
                          <>
                            <PhoneCall className="w-4 h-4" />
                            <span>In Call</span>
                          </>
                        ) : (
                          <>
                            <Video className="w-4 h-4" />
                            <span>Video Call</span>
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => selectedConversationId && deleteConversation(selectedConversationId)}
                      className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {conversationMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-gray-600 text-lg mb-2 font-medium">Start conversation</p>
                    <p className="text-gray-500 text-sm">Send your first message</p>
                  </div>
                ) : (
                  conversationMessages.map((message) => {
                    const isOwnMessage = message.senderId === account;
                    const userInfo = getUserInfo(message.senderId);
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                          {message.messageType === 'order' && (
                            <div className="mb-2 p-3 bg-gray-100 border border-gray-200 rounded-2xl">
                              <div className="flex items-center space-x-2">
                                <Package className="w-4 h-4 text-black" />
                                <span className="text-black font-medium text-sm">Order Reference</span>
                              </div>
                              <p className="text-gray-600 text-sm mt-1">Order #{message.orderId}</p>
                            </div>
                          )}
                          
                          <div
                            className={`px-4 py-3 rounded-3xl ${
                              isOwnMessage
                                ? 'bg-black text-white'
                                : 'bg-gray-100 text-black'
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{message.content}</p>
                          </div>
                          
                          <div className={`flex items-center space-x-2 mt-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                            </span>
                            {isOwnMessage && (
                              <div className="text-gray-500">
                                {message.read ? (
                                  <CheckCheck className="w-3 h-3" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {!isOwnMessage && (
                          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center mr-3 order-1 flex-shrink-0">
                            {userInfo?.avatar ? (
                              <img src={userInfo.avatar} alt={userInfo.name} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <User className="w-4 h-4 text-white" />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-6 border-t border-gray-100">
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black placeholder-gray-500 resize-none"
                      rows={2}
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="px-6 py-3 bg-black hover:luxe-glass disabled:bg-gray-300 text-white rounded-2xl transition-all duration-200 flex items-center space-x-2 self-end"
                  >
                    <Send className="w-4 h-4" />
                    <span>{t('messages.send')}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-2 font-medium">Select conversation</p>
                <p className="text-gray-500 text-sm">Choose a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}