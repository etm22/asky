import axios from 'axios';
import fs from 'fs/promises';
import {getUserAgent, sleep} from './utils';

async function convertTTS(text: string, save_path: string): Promise<void> {
	const data = {
		text,
		// voice: 'en-US-CoraNeural',
		voice: 'en-US-RogerNeural',
	};
	const headers = {
		'user-agent': getUserAgent(),
		referer: 'https://www.veed.io/',
	};
	const response = await axios.post(
		`https://www.veed.io/api/v1/subtitles/synthesize`,
		data,
		{headers}
	);
	try {
		const audio = await axios.get(response.data.data.synthesisResult.audioURL, {
			headers,
			responseType: 'arraybuffer',
		});
		await fs.writeFile(save_path, audio.data);
	} catch (error) {
		console.log(`Audio not ready, waiting 30 seconds...`);
		await sleep(30000);
		const audio = await axios.get(response.data.data.synthesisResult.audioURL, {
			headers,
			responseType: 'arraybuffer',
		});
		await fs.writeFile(save_path, audio.data);
	}
}

export default convertTTS;
