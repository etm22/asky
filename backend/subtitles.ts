import axios from 'axios';
import {generateRandomString, getFileSize, getUserAgent, sleep} from './utils';
import fs from 'fs/promises';
import getAudioDurationInSeconds from 'get-audio-duration';
import {SubtitleData, SubtitleWord} from './types';

interface UploadResponse {
	upload_url: string;
	cdn_url: string;
}

interface SubtitleResponse {
	data: {
		status: string;
		subtitles: {
			[key: string]: Subtitle;
		};
	};
}

interface Subtitle {
	from: number;
	to: number;
	words: SubtitleWord[];
}

const headers = {
	origin: 'https://www.veed.io',
	referer: 'https://www.veed.io/',
	'user-agent': getUserAgent(),
	'Content-Type': 'application/json',
};

async function createProject(): Promise<string> {
	const data = JSON.stringify({
		tool: 'subtitles',
		isAnonymous: true,
	});

	const response = await axios.post(`https://www.veed.io/api/projects`, data, {
		headers,
	});
	return response.data.id;
}

async function createMediaName(
	media_id: string,
	project_id: string
): Promise<void> {
	const data = JSON.stringify({
		data: {
			edit: {
				mediaSources: {
					[media_id]: {
						displayURL: null,
						onlineURL: '',
						duration: null,
					},
				},
			},
		},
		name: media_id,
	});

	await axios.put(`https://www.veed.io/api/projects/${project_id}`, data, {
		headers,
	});
}

async function getUploadUrlForMp3(
	media_id: string,
	audio_path: string
): Promise<UploadResponse> {
	const audio_size = await getFileSize(audio_path);

	const data = JSON.stringify({
		filename: `${media_id}.mp3`,
		contentSize: audio_size,
		assetType: 'AUDIO',
		assetSubType: 'SOURCE',
		group: 'srcVideo',
		plan: 'FREE',
		extension: 'mp3',
		mimeType: 'audio/mpeg',
		storage: 'PERMANENT',
	});

	const response = await axios.post(`https://www.veed.io/api/v1/asset`, data, {
		headers,
	});
	return {
		upload_url: response.data.data.url,
		cdn_url: response.data.data.asset.cdnUrl,
	};
}

async function uploadAudioToVeed(
	upload_url: string,
	audio_path: string
): Promise<void> {
	const audio_data = await fs.readFile(audio_path);
	await axios.put(upload_url, audio_data, {
		headers: {
			...headers,
			'Content-Type': 'audio/mpeg',
		},
	});
}

async function createSubtitles(
	media_id: string,
	cdn_url: string,
	project_id: string,
	audio_path: string
): Promise<SubtitleData[]> {
	const duration = await getAudioDurationInSeconds(audio_path);
	const data = JSON.stringify({
		trimStart: 0,
		trimEnd: duration,
		video_url: cdn_url,
		language_code: 'en-US',
		isDefault: true,
		workspaceId: null,
		projectId: project_id,
		language: 'en-US',
		videoUrl: cdn_url,
	});

	const transcription = await pollSubtitles(media_id, data);
	const subtitles: Subtitle[] = Object.values(transcription.data.subtitles);
	subtitles.sort((a: Subtitle, b: Subtitle) => a.from - b.from);

	const subtitle_data: SubtitleData[] = [];
	let last_idx = 0;

	for (let idx = 0; idx < subtitles.length; idx++) {
		const subtitle = subtitles[idx];

		const last_word = subtitle.words[subtitle.words.length - 1].value;
		const last_word_has_punctuation = last_word.match(/[.,!?]/g);

		if (last_word_has_punctuation) {
			const prev_subtitle = subtitles.slice(last_idx, idx + 1);
			const prev_subtitle_text = prev_subtitle
				.map((s) => s.words.map((w) => w.value).join(' '))
				.join(' ');

			const data: SubtitleData = {
				sentence: prev_subtitle_text,
				from: prev_subtitle[0].from,
				to: prev_subtitle[prev_subtitle.length - 1].to,
				sub_sentences: prev_subtitle.map((s) => {
					return {
						text: s.words.map((w) => w.value).join(' '),
						words_alignment: s.words,
					};
				}),
			};
			subtitle_data.push(data);
			last_idx = idx + 1;
		}
	}
	return subtitle_data;
}

async function pollSubtitles(media_id, data): Promise<SubtitleResponse> {
	const response = await axios.post(
		`https://www.veed.io/api/v1/subtitles/assets/${media_id}/transcribe`,
		data,
		{headers}
	);
	const res_data: SubtitleResponse = response.data;
	if (res_data.data.status !== 'active') {
		await sleep(2000);
		return await pollSubtitles(media_id, data);
	}

	return response.data;
}

async function createSubtitlesForAudio(
	audio_path: string
): Promise<SubtitleData[]> {
	const project_id = await createProject();
	const media_id = generateRandomString(21);
	await createMediaName(media_id, project_id);
	const {cdn_url, upload_url} = await getUploadUrlForMp3(media_id, audio_path);
	await uploadAudioToVeed(upload_url, audio_path);
	const subtitles = await createSubtitles(
		media_id,
		cdn_url,
		project_id,
		audio_path
	);
	console.log(`Created  subtitles for ${audio_path}`);
	return subtitles;
}

export default createSubtitlesForAudio;
