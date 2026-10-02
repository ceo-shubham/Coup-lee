/**
 * Extract YouTube Video ID from various URL formats
 */
export function extractYouTubeId(url) {
  if (!url) return null;
  const trimmed = url.trim();

  // If already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i,
    /music\.youtube\.com\/watch\?v=([^"&?\/\s]{11})/i,
  ];

  for (const regex of patterns) {
    const match = trimmed.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Fetch video metadata (title, author, thumbnail) using noembed/oEmbed
 */
export async function getYouTubeMetadata(videoId) {
  const fallbackMeta = {
    id: videoId,
    title: 'YouTube Video',
    artist: 'YouTube',
    thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
  };

  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(videoUrl)}`);
    if (response.ok) {
      const data = await response.json();
      return {
        id: videoId,
        title: data.title || fallbackMeta.title,
        artist: data.author_name || fallbackMeta.artist,
        thumbnail: data.thumbnail_url || fallbackMeta.thumbnail,
      };
    }
  } catch (err) {
    console.warn('Could not fetch oEmbed metadata, using fallback:', err);
  }

  return fallbackMeta;
}

/**
 * Format seconds into mm:ss or hh:mm:ss
 */
export function formatTime(seconds) {
  if (isNaN(seconds) || seconds === null || seconds === undefined || seconds < 0) {
    return '0:00';
  }
  const sec = Math.floor(seconds);
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const secs = sec % 60;

  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
