const KEY = 'bitstream_access';

function getMap() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

export function grantAccess(videoId, chapterId = null) {
  const map = getMap();
  const k = chapterId ? `${videoId}__${chapterId}` : `${videoId}__full`;
  map[k] = Date.now();
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function hasFullVideoAccess(videoId) {
  return `${videoId}__full` in getMap();
}

export function hasChapterAccess(videoId, chapterId) {
  const map = getMap();
  return `${videoId}__full` in map || `${videoId}__${chapterId}` in map;
}
