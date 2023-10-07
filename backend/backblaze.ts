const B2 = require('backblaze-b2');
const fs = require('fs/promises');
const path = require('path');
require('dotenv').config();

async function uploadFileToBackblaze(filePath) {
	const config = {
		applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
		applicationKey: process.env.B2_APPLICATION_KEY,
		bucketId: process.env.B2_BUCKET_ID,
		bucketName: process.env.B2_BUCKET_NAME,
	};

	const b2 = new B2({
		applicationKeyId: config.applicationKeyId,
		applicationKey: config.applicationKey,
	});

	const fileName = `${Date.now()}-${path.basename(filePath)}`;

	const response_1 = await b2.authorize();
	const download_url = response_1.data.downloadUrl;

	const response_2 = await b2.getUploadUrl({bucketId: config.bucketId});
	const {authorizationToken, uploadUrl} = response_2.data;

	await b2.uploadFile({
		uploadUrl: uploadUrl,
		uploadAuthToken: authorizationToken,
		fileName,
		data: await fs.readFile(filePath),
	});

	return `${download_url}/file/${config.bucketName}/${fileName}`;
}

export default uploadFileToBackblaze;
