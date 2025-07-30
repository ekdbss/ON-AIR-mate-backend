export const tryParseBookmarkMessage = (
  raw: string,
): { timeline: number; content: string } | null => {
  const trimmed = raw.trim();

  // HH:MM:SS 또는 MM:SS 정규표현식
  const regex = /^(\d{1,2}:)?(\d{1,2}):(\d{2})\s*(.*)$/;
  const match = trimmed.match(regex);

  if (!match) return null;

  const [, hourStr, minStr, secStr, content] = match;
  const hours = hourStr ? parseInt(hourStr.replace(':', ''), 10) : 0;
  const minutes = parseInt(minStr, 10);
  const seconds = parseInt(secStr, 10);

  if (minutes >= 60 || seconds >= 60) return null;

  const timeline = hours * 3600 + minutes * 60 + seconds;

  return {
    timeline,
    content: content.trim(),
  };
};
