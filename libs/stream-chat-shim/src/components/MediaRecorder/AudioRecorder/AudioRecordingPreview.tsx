import React from 'react';
// import { PauseIcon, PlayIcon } from '../../MessageInput/icons'; // TODO backend-wire-up
const PauseIcon = () => null as any;
const PlayIcon = () => null as any;
import { RecordingTimer } from './RecordingTimer';
// import { useAudioController } from '../../Attachment/hooks/useAudioController'; // TODO backend-wire-up
const useAudioController = () => ({
  audioRef: { current: null } as React.MutableRefObject<HTMLAudioElement | null>,
  isPlaying: false,
  progress: 0,
  secondsElapsed: 0,
  seek: () => {},
  togglePlay: () => {},
});
// import { WaveProgressBar } from '../../Attachment'; // TODO backend-wire-up
const WaveProgressBar = () => null as any;

export type AudioRecordingPlayerProps = React.ComponentProps<'audio'> & {
  durationSeconds: number;
  mimeType?: string;
  waveformData?: number[];
};

export const AudioRecordingPreview = ({
  durationSeconds,
  mimeType,
  waveformData,
  ...props
}: AudioRecordingPlayerProps) => {
  const { audioRef, isPlaying, progress, secondsElapsed, seek, togglePlay } =
    useAudioController({
      durationSeconds,
      mimeType,
    });

  const displayedDuration = secondsElapsed || durationSeconds;

  return (
    <React.Fragment>
      <audio ref={audioRef}>
        <source src={props.src} type={mimeType} />
      </audio>
      <button
        className='str-chat__audio_recorder__toggle-playback-button'
        data-testid='audio-recording-preview-toggle-play-btn'
        onClick={togglePlay}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
      <RecordingTimer durationSeconds={displayedDuration} />
      <div className='str-chat__wave-progress-bar__track-container'>
        <WaveProgressBar
          progress={progress}
          seek={seek}
          waveformData={waveformData || []}
        />
      </div>
    </React.Fragment>
  );
};
