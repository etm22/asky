export interface SubtitleData {
	sentence: string;
	from: number;
	to: number;
	sub_sentences: SubSentence[];
	video_url?: string;
}

export interface SubSentence {
	text: string;
	words_alignment: SubtitleWord[];
}

export interface SubtitleWord {
	from: number;
	to: number;
	value: string;
}
