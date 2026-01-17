import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';

export interface CalendarDay {
  date: Date;
  dateString: string; // YYYY-MM-DD format
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

/**
 * Get all days to display in a calendar month view
 * Includes days from previous/next month to fill the grid
 */
export function getCalendarDays(year: number, month: number): CalendarDay[] {
  const monthDate = new Date(year, month, 1);
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);

  // Get the start of the week containing the first day of the month
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday

  // Get the end of the week containing the last day of the month
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  // Get all days in the range
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return days.map((date) => ({
    date,
    dateString: format(date, 'yyyy-MM-dd'),
    dayOfMonth: date.getDate(),
    isCurrentMonth: isSameMonth(date, monthDate),
    isToday: isToday(date),
    isWeekend: date.getDay() === 0 || date.getDay() === 6,
  }));
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string, formatStr: string = 'MMM d, yyyy'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr);
}

/**
 * Get month name and year for display
 */
export function getMonthYearDisplay(year: number, month: number): string {
  const date = new Date(year, month, 1);
  return format(date, 'MMMM yyyy');
}

/**
 * Get short day names for calendar header
 */
export function getWeekDayNames(short: boolean = true): string[] {
  return short
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
}

/**
 * Check if two dates are the same day
 */
export function areSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  return isSameDay(d1, d2);
}

/**
 * Get today's date string in YYYY-MM-DD format
 */
export function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Get date range for the current week
 */
export function getCurrentWeekRange(): { start: string; end: string } {
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 0 });
  const end = endOfWeek(today, { weekStartsOn: 0 });
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
  };
}

/**
 * Get date range for current month
 */
export function getCurrentMonthRange(): { start: string; end: string } {
  const today = new Date();
  return {
    start: format(startOfMonth(today), 'yyyy-MM-dd'),
    end: format(endOfMonth(today), 'yyyy-MM-dd'),
  };
}

export { addMonths, subMonths, format, isToday, isSameDay };
