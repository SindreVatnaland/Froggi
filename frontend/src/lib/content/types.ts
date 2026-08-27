export interface ContentBlock {
	type: 'heading' | 'paragraph' | 'list' | 'note';
	text?: string;
	items?: string[];
}

export interface ContentTopic {
	id: string;
	title: string;
	category: 'app' | 'obs' | 'overlays' | 'remote-access' | 'minigames' | 'automation';
	summary: string;
	blocks: ContentBlock[];
}
