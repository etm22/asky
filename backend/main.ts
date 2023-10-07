import axios from 'axios';
import uploadFileToBackblaze from './backblaze';
import createSubtitlesForAudio from './subtitles';
import convertTTS from './tts';
import {readFile, writeFile} from 'fs/promises';
const execSync = require('child_process').execSync;
require('dotenv').config();

async function createVideo() {
	// const gpt_res = await askChatGPTQuestion(
	// 	"You're an expert in rating youtube channels. Your job is to rate objectively, the youtuber T-series out of 5 stars. Give a brief reason of around 50 words. Do not mention anything about rating objectively. Start your answer with: I rate.."
	// );

	const trivia_questions = JSON.parse(
		await readFile('backend/data/trivia.json', 'utf-8')
	);

	const selected_trivia = trivia_questions.filter((q) => !q.used)[0];
	await writeFile('public/data.json', JSON.stringify(selected_trivia));

	await convertTTS(
		`${selected_trivia.answer} ${selected_trivia.fact}`,
		'public/audio.mp3'
	);

	const subtitles = await createSubtitlesForAudio('public/audio.mp3');
	await writeFile('public/subtitles.json', JSON.stringify(subtitles));

	// render video
	execSync(`npx remotion render HelloWorld "out/video.mp4"`).toString();

	// update json file
	const updated_trivia_questions = trivia_questions.filter(
		(q) =>
			q.question != selected_trivia.question &&
			q.answer != selected_trivia.answer &&
			q.fact != selected_trivia.fact
	);
	updated_trivia_questions.push({
		...selected_trivia,
		used: true,
	});
	await writeFile(
		'backend/data/trivia.json',
		JSON.stringify(updated_trivia_questions)
	);

	// update readme
	const readme = `
	# Stats
	- ${updated_trivia_questions.filter((q) => q.used).length} / ${
		updated_trivia_questions.length
	}`;

	await writeFile('readme.md', readme);

	// upload to backblaze

	const url = await uploadFileToBackblaze('out/video.mp4');
	const data = JSON.stringify({
		video_title: `${selected_trivia.question} (Asking ChatGPT)`,
		video_description: `Asking ChatGPT: ${selected_trivia.question}`,
		video_url: url,
	});

	//  upload to youtube
	const response_3 = await axios.post(process.env.YT_UPLOADER_API, data);
	console.log(response_3.data.success);
}

(async () => {
	await createVideo();
})();
