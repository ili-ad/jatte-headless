import React from 'react';
import type { Event, LocalMessage } from 'chat-shim';

export type EventAvatarProps = Record<string, any>;

export type TimestampFormatterOptions = {
  calendar?: boolean;
  calendarFormats?: Record<string, string>;
  format?: string;
};

export type EventComponentProps = TimestampFormatterOptions & {
  message: LocalMessage & {
    event?: Event;
  };
  Avatar?: React.ComponentType<EventAvatarProps>;
};

/** Placeholder implementation of the EventComponent. */
export const EventComponent = ({ message }: EventComponentProps) => {
  return (
    <div data-testid="event-component-placeholder">
      {message?.text ?? 'Event'}
    </div>
  );
};

export default EventComponent;
