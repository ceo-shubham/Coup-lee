import React, { useState, useRef, useEffect } from 'react';
import {
  Youtube,
  Upload,
  Music,
  Plus,
  Play,
  ListPlus,
  X,
  AlertCircle,
  Sparkles,
  Cloud,
  Search,
  CheckCircle,
} from 'lucide-react';
import { extractYouTubeId, getYouTubeMetadata } from '../utils/youtubeParser';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

export function AddMediaModal({ isOpen, onClose, onAddTrack, roomId, currentUser }) {
  const [activeTab, setActiveTab] = useState('youtube'); // 'youtube', 'upload', 'library'
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [ytPreview, setYtPreview] = useState(null);
  const [isFetchingYt, setIsFetchingYt] = useState(false);
  const [ytError, setYtError] = useState('');

  // Audio Upload States
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Persistent B2 Library States
  const [libraryTracks, setLibraryTracks] = useState([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');

  const fileInputRef = useRef(null);

  // Fetch B2 library when tab is opened
  useEffect(() => {
    if (activeTab === 'library' && isOpen) {
      fetchLibrary();
    }
  }, [activeTab, isOpen]);

  const fetchLibrary = async () => {
    setIsLoadingLibrary(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/library`);
      const data = await res.json();
      if (data.success && Array.isArray(data.tracks)) {
        setLibraryTracks(data.tracks);
      }
    } catch (err) {
      console.warn('Failed to fetch library:', err);
    } finally {
      setIsLoadingLibrary(false);
    }
  };

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

  // Handle File Selection (Max 200MB)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 200 * 1024 * 1024) {
        setUploadError('File size exceeds the 200MB limit. Please choose an audio under 200MB.');
        setSelectedFile(null);
        return;
      }
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
    formData.append('userEmail', currentUser?.email || '');

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

  const handlePlayLibraryTrack = (track, playImmediately = false) => {
    const formattedTrack = {
      id: track.id || 'b2_' + track.filename,
      type: 'audio',
      title: track.title,
      artist: track.artist || 'Cloud Track',
      url: track.url || `/api/stream/${track.filename}`,
      duration: track.duration || 0,
      size: track.size || 0,
      thumbnail: null,
      addedBy: {
        name: currentUser?.name || 'Partner',
        avatar: currentUser?.avatar || '',
      },
    };
    onAddTrack(formattedTrack, playImmediately);
    onClose();
  };

  const filteredLibrary = libraryTracks.filter((t) =>
    (t.title || '').toLowerCase().includes(librarySearch.toLowerCase()) ||
    (t.uploadedBy || '').toLowerCase().includes(librarySearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg glass-panel-glow rounded-3xl p-5 sm:p-7 border border-rose-500/30 relative shadow-2xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-rose-900/40 mb-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-400" />
            <h3 className="text-lg sm:text-xl font-bold text-white">Add Music / Video</h3>
          </div>
          <button
            onClick={() => !isUploading && onClose()}
            disabled={isUploading}
            className="p-1.5 rounded-full hover:bg-rose-900/50 text-rose-300 hover:text-white transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher (3 Tabs: YouTube, Upload, B2 Library) */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-rose-950/60 rounded-2xl mb-4 border border-rose-900/40 flex-shrink-0">
          <button
            onClick={() => setActiveTab('youtube')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl font-semibold text-xs transition-all ${
              activeTab === 'youtube'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md'
                : 'text-rose-300/80 hover:text-white'
            }`}
          >
            <Youtube className="w-3.5 h-3.5 text-red-400" />
            <span>YouTube</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl font-semibold text-xs transition-all ${
              activeTab === 'upload'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md'
                : 'text-rose-300/80 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-rose-300" />
            <span>Upload</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl font-semibold text-xs transition-all ${
              activeTab === 'library'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md'
                : 'text-rose-300/80 hover:text-white'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-sky-400" />
            <span>Saved ({libraryTracks.length})</span>
          </button>
        </div>

        {/* YouTube Tab Content */}
        {activeTab === 'youtube' && (
          <div className="space-y-4 overflow-y-auto">
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
              <div className="flex items-center justify-center py-6 text-rose-300 gap-2">
                <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium">Fetching video details...</span>
              </div>
            )}

            {ytPreview && !isFetchingYt && (
              <div className="flex items-center gap-3 p-3 bg-rose-950/40 rounded-2xl border border-rose-500/20">
                <img
                  src={ytPreview.thumbnail}
                  alt={ytPreview.title}
                  className="w-16 h-12 rounded-lg object-cover border border-rose-800"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{ytPreview.title}</h4>
                  <p className="text-xs text-rose-300/80 truncate">{ytPreview.artist}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleAddYouTube(false)}
                disabled={!youtubeUrl || isFetchingYt}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-xs sm:text-sm font-semibold text-rose-200 flex items-center justify-center gap-2 disabled:opacity-40 transition-all active:scale-98"
              >
                <ListPlus className="w-4 h-4" />
                <span>Add to Queue</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddYouTube(true)}
                disabled={!youtubeUrl || isFetchingYt}
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
          <div className="space-y-4 overflow-y-auto">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg"
              className="hidden"
            />

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
                Supports MP3, WAV, AAC, M4A, FLAC (Max 200MB)
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
                  <span>Uploading to Backblaze B2 & sync...</span>
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
              ☁️ Songs under 50MB and admin uploads are saved permanently to Backblaze B2 so you can play them anytime!
            </p>
          </div>
        )}

        {/* Saved Library Tab Content */}
        {activeTab === 'library' && (
          <div className="flex-1 min-h-0 flex flex-col space-y-3 overflow-hidden">
            {/* Search Input */}
            <div className="relative flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-300/60" />
              <input
                type="text"
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                placeholder="Search saved songs..."
                className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs text-white placeholder-rose-300/40"
              />
            </div>

            {/* Track List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {isLoadingLibrary ? (
                <div className="py-8 text-center text-xs text-rose-300 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                  <span>Loading cloud library...</span>
                </div>
              ) : filteredLibrary.length === 0 ? (
                <div className="py-8 text-center text-rose-300/60 text-xs">
                  <p>No saved songs found.</p>
                  <p className="mt-1 text-[11px] text-rose-400/80">Upload an audio under 50MB or as admin to save it permanently!</p>
                </div>
              ) : (
                filteredLibrary.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-rose-950/40 hover:bg-rose-900/40 border border-rose-500/20 transition-all gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">{t.title}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-sky-950/60 border border-sky-400/40 text-sky-300 flex-shrink-0">
                          B2 Cloud
                        </span>
                      </div>
                      <p className="text-[10px] text-rose-300/70 truncate mt-0.5">
                        {t.size ? `${(t.size / (1024 * 1024)).toFixed(1)} MB` : 'Audio'} • Added by {t.uploadedBy || 'Admin'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handlePlayLibraryTrack(t, false)}
                        className="p-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/30 text-rose-200 transition-colors"
                        title="Add to Queue"
                      >
                        <ListPlus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handlePlayLibraryTrack(t, true)}
                        className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold text-xs shadow-glow-pink flex items-center gap-1 hover:opacity-95 transition-all"
                        title="Play Now"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Play</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
