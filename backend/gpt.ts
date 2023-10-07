import {getUserAgent} from './utils';

const axios = require('axios');
const FData = require('form-data');

async function askChatGPTQuestion(question: string): Promise<string> {
	const USER_ID = '6adcf568-0b0c-4077-ae3f-a6a898489673';
	const headers = {
		origin: 'https://chat.gptonline.ai',
		referer: 'https://chat.gptonline.ai/',
		'user-agent': getUserAgent(),
	};
	const API_URL = 'https://chat.gptonline.ai';

	// create chat
	let data = new FData();
	data.append('msg', question);
	data.append('user_id', USER_ID);

	const response = await axios.post(`${API_URL}/send-message.php`, data, {
		headers,
		...data.getHeaders(),
	});

	const chat_id = response.data.id;

	// Ask question
	const response_2 = await axios.get(
		`${API_URL}/index.php?chat_history_id=${chat_id}&id=${USER_ID}`,
		{headers}
	);
	let result = response_2.data;
	result = result.split('\n').filter((a) => a.indexOf('data: {') >= 0);
	result = result.map((r) => JSON.parse(`${r.replace('data: ', '')}`));
	result = result.map((r) => r.choices[0].delta.content);
	return result.join('');
}

export default askChatGPTQuestion;
