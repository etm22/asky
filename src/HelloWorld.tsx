import {Audio, Img, Sequence} from 'remotion';
import {
	delayRender,
	staticFile,
	AbsoluteFill,
	continueRender,
	useVideoConfig,
} from 'remotion';

import subtitles from '../public/subtitles.json';
import data from '../public/data.json';

export const HelloWorld: React.FC = () => {
	const waitForFont = delayRender();
	const font = new FontFace(
		`soehne`,
		`url('${staticFile('soehne-buch.woff2')}') format('woff2')`
	);
	font
		.load()
		.then(() => {
			document.fonts.add(font);
			continueRender(waitForFont);
		})
		.catch((err) => console.log('Error loading font', err));

	const videoConfig = useVideoConfig();
	let displayedCharacters = '';

	return (
		<AbsoluteFill style={{backgroundColor: '#444654'}}>
			<Audio src={staticFile('audio.mp3')} />
			<Audio src={staticFile('music.mp3')} volume={0.15} />

			<AbsoluteFill
				style={{
					backgroundColor: '#343541',
					zIndex: 2,
					height: '21%',
				}}
			>
				<AbsoluteFill style={{left: '12%', top: '25%', zIndex: 99}}>
					<Img height={100} width={100} src={staticFile('rickroll.png')} />
				</AbsoluteFill>
				<AbsoluteFill style={{left: '20%', top: '8%', width: '65%'}}>
					<p
						style={{
							fontSize: '3em',
							color: '#ececf1',
							fontFamily: 'soehne',
						}}
					>
						{data.question}
					</p>
				</AbsoluteFill>
			</AbsoluteFill>

			{subtitles.map((subtitle) => {
				return subtitle.sub_sentences.map((subsentence) => {
					return subsentence.words_alignment.map((word) => {
						displayedCharacters += ` ${word.value.replace('Irate', 'I rate')}`;
						return (
							<Sequence
								style={{backgroundColor: '#444654'}}
								from={Math.round(word.from * videoConfig.fps)}
								durationInFrames={Math.round(
									videoConfig.fps * word.to - word.from
								)}
							>
								<AbsoluteFill style={{left: '12%', top: '27%'}}>
									<Img
										height={100}
										width={100}
										src={staticFile('chatgpt.png')}
									/>
								</AbsoluteFill>
								<AbsoluteFill style={{left: '20%', top: '23%', width: '65%'}}>
									<p
										style={{
											color: '#d1d5db',
											fontSize: '3em',
											fontFamily: 'soehne',
											lineHeight: '5rem',
										}}
									>
										{displayedCharacters}
									</p>
								</AbsoluteFill>
							</Sequence>
						);
					});
				});
			})}
		</AbsoluteFill>
	);
};
