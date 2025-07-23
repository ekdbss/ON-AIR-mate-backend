/**
 * ISO 8601 기간 문자열(e.g., "PT1H2M3S")을 "hh:mm:ss" 또는 "mm:ss" 형식으로 변환
 * @param duration ISO 8601 기간 문자열
 * @returns 포맷팅된 시간 문자열 (e.g., "01:02:03" or "02:03")
 */
export const formatISO8601Duration = (duration: string): string => {
  if (!duration) {
    return '00:00';
  }

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  if (!match) {
    return '00:00';
  }

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const pad = (num: number) => num.toString().padStart(2, '0');

  if (h > 0) {
    return `${h}:${pad(m)}:${pad(s)}`;
  }
  return `${pad(m)}:${pad(s)}`;
};
