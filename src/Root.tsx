import {Composition, continueRender, delayRender, staticFile} from 'remotion';
import {HelloWorld} from './HelloWorld';
import {useState} from 'react';
import {getAudioDurationInSeconds} from '@remotion/media-utils';

export const RemotionRoot: React.FC = () => {
	const [handle] = useState(() => delayRender());
	const [duration, setDuration] = useState(1);
	const fps = 10;

	getAudioDurationInSeconds(staticFile('audio.mp3'))
		.then((durationInSeconds) => {
			setDuration(Math.round(durationInSeconds * fps));
			continueRender(handle);
		})
		.catch((err) => {
			console.log(`Error fetching metadata: ${err}`);
		});

	return (
		<>
			<Composition
				id="HelloWorld"
				component={HelloWorld}
				durationInFrames={duration}
				fps={fps}
				width={1920}
				height={1080}
			/>
		</>
	);
};
