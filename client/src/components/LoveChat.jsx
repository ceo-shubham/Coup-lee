import React, { useState, useEffect, useRef } from 'react';
import { MessageCircleHeart, Send, Heart, X, Sparkles, Flame, Smile } from 'lucide-react';

const ROMANTIC_EMOJIS = ['❤️', '💖', '🔥', '🌹', '✨', '🌙', '🥺', '💍', '🥂', '🥰'];

export function LoveChat({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  onSendReaction,
  currentUser,
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), 'text', null, currentUser);
    setInputText('');
  };

  const handleQuickEmoji = (emoji) => {
    onSendReaction(emoji, currentUser);
    onSendMessage(emoji, 'emoji', emoji, currentUser);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 z-50 glass-panel-glow border-l border-rose-500/30 shadow-2xl flex flex-col animate-slideLeft">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-rose-900/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircleHeart className="w-5 h-5 text-rose-400" />
          <h3 className="font-bold text-white text-base">Love Notes & Whispers</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-rose-900/50 text-rose-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Love Reaction Bar */}
      <div className="px-3 py-2 bg-rose-950/40 border-b border-rose-900/40 flex items-center gap-1.5 overflow-x-auto">
        <span className="text-[11px] font-bold text-rose-300/80 uppercase px-1">React:</span>
        {ROMANTIC_EMOJIS.map((emoji, i) => (
          <button
            key={i}
            onClick={() => handleQuickEmoji(emoji)}
            className="p-1.5 rounded-xl hover:bg-rose-800/40 hover:scale-125 transform transition-all text-base shrink-0 active:scale-90"
            title={`Send ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="py-12 text-center text-rose-300/60 text-xs space-y-2">
            <Heart className="w-8 h-8 mx-auto text-rose-500/40 animate-pulse" />
            <p>Send a whisper or love note to your partner!</p>
            <p className="text-[11px] text-rose-400/80">Messages appear live in your sync room.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender?.id === currentUser?.id || msg.sender?.name === currentUser?.name;
            const isSystem = msg.type === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} className="text-center my-2">
                  <span className="text-[11px] bg-rose-950/60 border border-rose-900/40 px-3 py-1 rounded-full text-rose-300">
                    {msg.text}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {!isMe && (
                  <span className="text-[10px] text-rose-300/70 ml-1 mb-0.5">
                    {msg.sender?.name || 'Partner'}
                  </span>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm shadow-md break-words ${
                    isMe
                      ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-br-none'
                      : 'bg-rose-950/80 border border-rose-500/30 text-rose-100 rounded-bl-none'
                  } ${msg.type === 'emoji' ? 'text-2xl py-1 px-2.5 bg-transparent border-none shadow-none' : ''}`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-rose-400/50 mt-0.5 mx-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="p-3 bg-rose-950/60 border-t border-rose-900/40 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Whisper something sweet..."
          className="flex-1 px-3.5 py-2.5 rounded-xl glass-input text-white text-xs sm:text-sm placeholder-rose-300/40"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-glow-pink hover:opacity-95 disabled:opacity-40 transition-all active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
