import React, { useState, useRef } from 'react';
import { extractYouTubeId, getYouTubeMetadata } from '../utils/youtubeParser';
import { Youtube, Upload, Music, X, Sparkles, Check, AlertCircle, Play, ListPlus } from 'lucide-react';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

export function AddMediaModal({ isOpen, onClose, onAddTrack, roomId, currentUser }) {
  const [activeTab, setActiveTab] = useState('youtube'); // 'youtube' | 'upload'
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [ytPreview, setYtPreview] = useState(null);
  const [isFetchingYt, setIsFetchingYt] = useState(false);
  const [ytError, setYtError] = useState('');

  // Audio Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Handle YouTube URL input
  const handleYoutubeUrlChange = async (e) => {
    const url = e.target.value;
    setYoutubeUrl(url);
    setYtError('');

    const videoId = extractYouTubeId(url);
    if (videoId) {
      setIsFetchingYt(true);
      try {
        const meta = await getYouTubeMetadata(videoId);
        setYtPreview(meta);
      } catch {
        setYtPreview({
          id: videoId,
          title: 'YouTube Video',
          artist: 'YouTube',
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        });
      } finally {
        setIsFetchingYt(false);
      }
    } else {
      setYtPreview(null);
    }
  };

  const handleAddYouTube = (playImmediately = false) => {
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      setYtError('Please enter a valid YouTube video or music link');
      return;
    }

    const track = {
      id: 'yt_' + videoId + '_' + Date.now(),
      videoId,
      type: 'youtube',
      title: ytPreview?.title || 'YouTube Video',
      artist: ytPreview?.artist || 'YouTube',
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: ytPreview?.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      addedBy: {
        name: currentUser?.name || 'Partner',
        avatar: currentUser?.avatar || '',
      },
    };

    onAddTrack(track, playImmediately);
    onClose();
  };

  // Handle File Selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
      setUploadError('');
    }
  };

  const handleUploadAudio = async (playImmediately = false) => {
    if (!selectedFile) {
      setUploadError('Please select an audio file first');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setUploadError('');

    const formData = new FormData();
    formData.append('audio', selectedFile);
    formData.append('roomId', roomId);
    formData.append('title', uploadTitle || selectedFile.name);
    formData.append('artist', 'Uploaded Track');
    formData.append('userName', currentUser?.name || 'Partner');
    formData.append('userAvatar', currentUser?.avatar || '');

    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      const promise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.error || 'Upload failed'));
            } catch {
              reject(new Error(`Server returned status ${xhr.status}`));
            }
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
      });

      xhr.open('POST', `${SERVER_URL}/api/upload`, true);
      xhr.send(formData);

      const data = await promise;
      if (data.success && data.track) {
        onAddTrack(data.track, playImmediately);
        onClose();
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError(err.message || 'Failed to upload audio');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg glass-panel-glow rounded-3xl p-6 sm:p-7 border border-rose-500/30 relative shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-rose-900/40 mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-400" />
            <h3 className="text-lg sm:text-xl font-bold text-white">Add Music / Video</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-rose-900/50 text-rose-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-rose-950/60 rounded-2xl mb-6 border border-rose-900/40">
          <button
            onClick={() => setActiveTab('youtube')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
              activeTab === 'youtube'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md'
                : 'text-rose-300/80 hover:text-white'
            }`}
          >
            <Youtube className="w-4 h-4 text-red-400" />
            <span>YouTube Link</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
              activeTab === 'upload'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md'
                : 'text-rose-300/80 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4 text-rose-300" />
            <span>Upload Audio</span>
          </button>
        </div>

        {/* YouTube Tab Content */}
        {activeTab === 'youtube' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-rose-200 uppercase tracking-wider mb-2">
                Paste YouTube Video / Song Link
              </label>
              <input
                type="text"
                value={youtubeUrl}
                onChange={handleYoutubeUrlChange}
                placeholder="https://www.youtube.com/watch?v=... or youtu.be/..."
                className="w-full px-4 py-3 rounded-xl glass-input text-white text-sm placeholder-rose-300/40"
              />
            </div>

            {ytError && (
              <p className="text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {ytError}
              </p>
            )}

            {/* Video Preview Card */}
            {isFetchingYt && (
              <div className="py-4 text-center text-xs text-rose-300 animate-pulse">
                Fetching video details...
              </div>
            )}

            {ytPreview && !isFetchingYt && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-950/60 border border-rose-500/30">
                <img
                  src={ytPreview.thumbnail}
                  alt={ytPreview.title}
                  className="w-20 h-14 object-cover rounded-lg shadow"
                />
                <div className="overflow-hidden flex-1">
                  <h4 className="font-semibold text-xs sm:text-sm text-white truncate">
                    {ytPreview.title}
                  </h4>
                  <p className="text-[11px] text-rose-300/70 truncate">{ytPreview.artist}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleAddYouTube(false)}
                disabled={!ytPreview}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-xs sm:text-sm font-semibold text-rose-200 flex items-center justify-center gap-2 disabled:opacity-40 transition-all active:scale-98"
              >
                <ListPlus className="w-4 h-4" />
                <span>Add to Queue</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddYouTube(true)}
                disabled={!ytPreview}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-glow-pink disabled:opacity-40 transition-all hover:opacity-95 active:scale-98"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Play Now</span>
              </button>
            </div>
          </div>
        )}

        {/* Audio Upload Tab Content */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Drag & Drop or Click Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-rose-500/40 hover:border-rose-400 bg-rose-950/30 hover:bg-rose-950/50 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-300">
                <Music className="w-6 h-6" />
              </div>
              <p className="font-semibold text-xs sm:text-sm text-white">
                {selectedFile ? selectedFile.name : 'Click to select or drop an audio file'}
              </p>
              <p className="text-[11px] text-rose-300/70">
                Supports MP3, WAV, AAC, M4A, FLAC (any size)
              </p>
            </div>

            {selectedFile && (
              <div>
                <label className="block text-xs font-semibold text-rose-200 uppercase tracking-wider mb-1.5">
                  Track Title
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Song name"
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-white text-sm"
                />
              </div>
            )}

            {isUploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-rose-300">
                  <span>Uploading song to partner sync...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-rose-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {uploadError && (
              <p className="text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {uploadError}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleUploadAudio(false)}
                disabled={!selectedFile || isUploading}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-xs sm:text-sm font-semibold text-rose-200 flex items-center justify-center gap-2 disabled:opacity-40 transition-all active:scale-98"
              >
                <ListPlus className="w-4 h-4" />
                <span>Add to Queue</span>
              </button>

              <button
                type="button"
                onClick={() => handleUploadAudio(true)}
                disabled={!selectedFile || isUploading}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-glow-pink disabled:opacity-40 transition-all hover:opacity-95 active:scale-98"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{isUploading ? 'Uploading...' : 'Play Now'}</span>
              </button>
            </div>

            <p className="text-[10px] text-rose-300/60 text-center leading-relaxed">
              🔒 Ephemeral Storage: Uploaded files are streamed synchronously and automatically deleted from the server when you disconnect or close the tab.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
