import { formatDate, getRelativeTime, isToday } from '../date';

describe('Date Utils', () => {
  test('formatDate should format date correctly', () => {
    const date = new Date('2023-10-01T12:30:45');
    expect(formatDate(date, 'YYYY-MM-DD')).toBe('2023-10-01');
    expect(formatDate(date, 'YYYY/MM/DD HH:mm:ss')).toBe('2023/10/01 12:30:45');
  });

  test('getRelativeTime should return correct relative time', () => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    expect(getRelativeTime(oneMinuteAgo)).toBe('1分钟前');
    expect(getRelativeTime(oneHourAgo)).toBe('1小时前');
  });

  test('isToday should correctly identify today', () => {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    expect(isToday(today)).toBe(true);
    expect(isToday(yesterday)).toBe(false);
  });
});