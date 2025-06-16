export const CUSTOM_MESSAGE_TYPE = {
  date: 'message.date',
  intro: 'channel.intro',
} as const;

type IntroMessage = {
  customType: typeof CUSTOM_MESSAGE_TYPE.intro;
  id: string;
};

export const makeIntroMessage = (): IntroMessage => ({
  customType: CUSTOM_MESSAGE_TYPE.intro,
  id: Math.random().toString(36).slice(2),
});

export const isIntroMessage = (msg: unknown): msg is IntroMessage =>
  typeof msg === 'object' && msg !== null && (msg as any).customType === CUSTOM_MESSAGE_TYPE.intro;

