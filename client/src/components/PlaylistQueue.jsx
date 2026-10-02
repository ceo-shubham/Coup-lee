import React, { useState } from 'react';
import { ListMusic, History, Play, Trash2, X, Music, Youtube, User } from 'lucide-react';

export function PlaylistQueue({
  isOpen,
  onClose,
  queue,
  history,
  currentTrack,
  onPlayTrack,
  onRemoveTrack,
}) {
  const [tab, setTab] = useState('queue'); // 'queue' | 'history'

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 z-50 glass-panel-glow border-l border-rose-500/30 shadow-2xl flex flex-col animate-slideLeft">
      {/* Drawer Header */}
      <div className="p-4 sm:p-5 border-b border-rose-900/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListMusic className="w-5 h-5 text-rose-400" />
          <h3 className="font-bold text-white text-base">Playlist & History</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-rose-900/50 text-rose-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1 p-2 bg-rose-950/40 border-b border-rose-900/40">
        <button
          onClick={() => setTab('queue')}
          className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            tab === 'queue'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-rose-300/70 hover:text-white'
          }`}
        >
          <ListMusic className="w-3.5 h-3.5" />
          <span>Queue ({queue?.length || 0})</span>
        </button>

        <button
          onClick={() => setTab('history')}
          className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            tab === 'history'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-rose-300/70 hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>History ({history?.length || 0})</span>
        </button>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Currently Playing Card */}
        {currentTrack && tab === 'queue' && (
          <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/50 shadow-glow-pink mb-4">
            <span className="text-[10px] uppercase font-bold text-rose-300 tracking-wider block mb-1">
              Now Playing
            </span>
            <div className="flex items-center gap-3">
              <img
                src={
                  currentTrack.thumbnail ||
                  'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=100'
                }
                alt={currentTrack.title}
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div className="flex-1 overflow-hidden">
                <h4 className="font-bold text-xs sm:text-sm text-white truncate">
                  {currentTrack.title}
                </h4>
                <p className="text-[11px] text-rose-300/80 truncate">{currentTrack.artist}</p>
                <div className="text-[10px] text-rose-400/80 mt-0.5 flex items-center gap-1">
                  <span>by</span>
                  <span className="font-medium text-rose-200">{currentTrack.addedBy?.name || 'Partner'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Queue Items */}
        {tab === 'queue' && (
          <>
            {queue?.length === 0 ? (
              <div className="py-12 text-center text-rose-300/60 text-xs">
                <Music className="w-8 h-8 mx-auto mb-2 text-rose-500/40" />
                <p>The queue is empty.</p>
                <p className="text-[11px] text-rose-400/80 mt-1">Add tracks to line them up!</p>
              </div>
            ) : (
              queue?.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 border border-rose-900/40 transition-all group"
                >
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <span className="text-xs font-mono text-rose-400/60 w-4">{idx + 1}</span>
                    <img
                      src={
                        item.thumbnail ||
                        'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=100'
                      }
                      alt={item.title}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="overflow-hidden flex-1">
                      <h4 className="font-semibold text-xs text-white truncate">{item.title}</h4>
                      <p className="text-[10px] text-rose-300/70 truncate">{item.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onPlayTrack(item)}
                      className="p-1.5 rounded-lg bg-rose-600/40 hover:bg-rose-600 text-white transition-colors"
                      title="Play Now"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                    </button>
                    <button
                      onClick={() => onRemoveTrack(item.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-900/60 text-rose-400 hover:text-rose-200 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* History Items */}
        {tab === 'history' && (
          <>
            {history?.length === 0 ? (
              <div className="py-12 text-center text-rose-300/60 text-xs">
                <History className="w-8 h-8 mx-auto mb-2 text-rose-500/40" />
                <p>No recently played tracks yet.</p>
              </div>
            ) : (
              history?.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 border border-rose-900/40 transition-all"
                >
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <img
                      src={
                        item.thumbnail ||
                        'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=100'
                      }
                      alt={item.title}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="overflow-hidden flex-1">
                      <h4 className="font-semibold text-xs text-white truncate">{item.title}</h4>
                      <p className="text-[10px] text-rose-300/70 truncate">{item.artist}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onPlayTrack(item)}
                    className="p-1.5 rounded-lg bg-rose-600/40 hover:bg-rose-600 text-white transition-colors"
                    title="Replay"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                  </button>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
