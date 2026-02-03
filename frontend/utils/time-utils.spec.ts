import { formatDuration, formatTrackDuration } from './time-utils';

describe('formatDuration', () => {
  it('returns hours and minutes when duration >= 1 hour', () => {
    expect(formatDuration(90 * 60 * 1000)).toBe('1 hr 30 min');
    expect(formatDuration(2 * 60 * 60 * 1000)).toBe('2 hr 0 min');
  });

  it('returns only minutes when duration < 1 hour', () => {
    expect(formatDuration(45 * 60 * 1000)).toBe('45 min');
    expect(formatDuration(0)).toBe('0 min');
  });

  it('floors partial minutes', () => {
    expect(formatDuration(61 * 60 * 1000)).toBe('1 hr 1 min');
    expect(formatDuration(59999)).toBe('0 min');
  });
});

describe('formatTrackDuration', () => {
  it('formats as MM:SS with zero-padded seconds', () => {
    expect(formatTrackDuration(3 * 60 * 1000 + 45 * 1000)).toBe('3:45');
    expect(formatTrackDuration(0)).toBe('0:00');
    expect(formatTrackDuration(30 * 1000)).toBe('0:30');
  });

  it('pads seconds with leading zero', () => {
    expect(formatTrackDuration(65 * 1000)).toBe('1:05');
    expect(formatTrackDuration(5 * 60 * 1000 + 9 * 1000)).toBe('5:09');
  });

  it('floors partial seconds', () => {
    expect(formatTrackDuration(59999)).toBe('0:59');
  });
});
