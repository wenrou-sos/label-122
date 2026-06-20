import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isoWeek);
dayjs.extend(isBetween);

export const formatDate = (
  date: dayjs.ConfigType,
  format: string = 'YYYY-MM-DD',
): string => dayjs(date).format(format);

export const todayStr = (): string => dayjs().format('YYYY-MM-DD');

export const parseDate = (date: dayjs.ConfigType): dayjs.Dayjs => dayjs(date);

export const isSameDay = (a: dayjs.ConfigType, b: dayjs.ConfigType): boolean =>
  dayjs(a).isSame(b, 'day');

export const isBefore = (a: dayjs.ConfigType, b: dayjs.ConfigType): boolean =>
  dayjs(a).isBefore(dayjs(b), 'day');

export const isAfter = (a: dayjs.ConfigType, b: dayjs.ConfigType): boolean =>
  dayjs(a).isAfter(dayjs(b), 'day');

export const diffDays = (
  from: dayjs.ConfigType,
  to: dayjs.ConfigType,
): number => dayjs(to).diff(dayjs(from), 'day');

export const addDays = (
  date: dayjs.ConfigType,
  days: number,
): dayjs.Dayjs => dayjs(date).add(days, 'day');

export const startOfMonth = (date: dayjs.ConfigType): dayjs.Dayjs =>
  dayjs(date).startOf('month');

export const endOfMonth = (date: dayjs.ConfigType): dayjs.Dayjs =>
  dayjs(date).endOf('month');

export const daysInMonth = (date: dayjs.ConfigType): number =>
  dayjs(date).daysInMonth();

export const firstWeekdayOfMonth = (date: dayjs.ConfigType): number =>
  startOfMonth(date).day();

export const getMonthLabel = (year: number, month: number): string =>
  `${year}年${month + 1}月`;

export const getWeekdayCN = (date: dayjs.ConfigType): string => {
  const map = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return map[dayjs(date).day()];
};

export const isInRange = (
  date: dayjs.ConfigType,
  start: dayjs.ConfigType,
  end: dayjs.ConfigType,
  inclusive: boolean = true,
): boolean =>
  dayjs(date).isBetween(
    start,
    end,
    'day',
    inclusive ? '[]' : '()',
  );

export const buildMonthCells = (
  year: number,
  month: number,
): { date: string; day: number; isCurrentMonth: boolean; isToday: boolean; isFuture: boolean; weekday: number }[] => {
  const today = dayjs();
  const first = startOfMonth(dayjs(new Date(year, month, 1)));
  const prefixDays = first.day();
  const totalDays = daysInMonth(first);
  const suffixDays = 42 - prefixDays - totalDays;

  const cells: { date: string; day: number; isCurrentMonth: boolean; isToday: boolean; isFuture: boolean; weekday: number }[] = [];

  for (let i = prefixDays - 1; i >= 0; i--) {
    const d = addDays(first, -i - 1);
    cells.push({
      date: formatDate(d),
      day: d.date(),
      isCurrentMonth: false,
      isToday: false,
      isFuture: d.isAfter(today, 'day'),
      weekday: d.day(),
    });
  }

  for (let i = 0; i < totalDays; i++) {
    const d = addDays(first, i);
    cells.push({
      date: formatDate(d),
      day: d.date(),
      isCurrentMonth: true,
      isToday: d.isSame(today, 'day'),
      isFuture: d.isAfter(today, 'day'),
      weekday: d.day(),
    });
  }

  const last = addDays(first, totalDays - 1);
  for (let i = 0; i < suffixDays; i++) {
    const d = addDays(last, i + 1);
    cells.push({
      date: formatDate(d),
      day: d.date(),
      isCurrentMonth: false,
      isToday: false,
      isFuture: d.isAfter(today, 'day'),
      weekday: d.day(),
    });
  }

  return cells;
};

export { dayjs };
