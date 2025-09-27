export type ReminderTimerHandle =
  | ReturnType<typeof setTimeout>
  | ReturnType<typeof setInterval>;

type ReminderTimerEntry = {
  clear: () => void;
};

const activeReminderTimers = new Map<ReminderTimerHandle, ReminderTimerEntry>();

const registerTimer = <T extends ReminderTimerHandle>(
  handle: T,
  clear: ReminderTimerEntry['clear'],
): T => {
  activeReminderTimers.set(handle, { clear });
  return handle;
};

export const scheduleReminderTimeout = (
  callback: () => void,
  delay: number,
): ReturnType<typeof setTimeout> => {
  const timeout = setTimeout(() => {
    activeReminderTimers.delete(timeout);
    callback();
  }, delay);

  return registerTimer(timeout, () => clearTimeout(timeout));
};

export const scheduleReminderInterval = (
  callback: () => void,
  delay: number,
): ReturnType<typeof setInterval> => {
  const interval = setInterval(callback, delay);
  return registerTimer(interval, () => clearInterval(interval));
};

export const trackReminderTimer = <T extends ReminderTimerHandle>(
  handle: T,
  clear: ReminderTimerEntry['clear'],
): T => registerTimer(handle, clear);

export const cancelReminderTimer = (
  handle: ReminderTimerHandle,
): void => {
  const entry = activeReminderTimers.get(handle);
  if (!entry) return;
  entry.clear();
  activeReminderTimers.delete(handle);
};

export const forgetReminderTimer = (handle: ReminderTimerHandle): void => {
  activeReminderTimers.delete(handle);
};

export const clearAllReminderTimers = (): void => {
  activeReminderTimers.forEach((entry) => {
    entry.clear();
  });
  activeReminderTimers.clear();
};

export const getTrackedReminderTimerCount = (): number =>
  activeReminderTimers.size;
