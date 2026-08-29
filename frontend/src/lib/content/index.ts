import type { ContentBlock, ContentTopic } from './types';
import { appTopics } from './topics/app';
import { obsIntegrationTopics } from './topics/obsIntegration';
import { overlayBasicsTopics } from './topics/overlayBasics';
import { remoteAccessTopics } from './topics/remoteAccess';
import { minigamesTopics } from './topics/minigames';
import { automationTopics } from './topics/automation';
import { webhookTopics } from './topics/webhooks';

export const ALL_TOPICS: ContentTopic[] = [
	...appTopics,
	...obsIntegrationTopics,
	...overlayBasicsTopics,
	...remoteAccessTopics,
	...minigamesTopics,
	...automationTopics,
	...webhookTopics,
];

export function getTopic(id: string): ContentTopic | undefined {
	return ALL_TOPICS.find((t) => t.id === id);
}

function renderBlock(block: ContentBlock): string {
	switch (block.type) {
		case 'heading':
			return `## ${block.text ?? ''}`;
		case 'list':
			return [block.text, ...(block.items ?? []).map((i) => `- ${i}`)].filter(Boolean).join('\n');
		case 'note':
			return `> ${block.text ?? ''}`;
		case 'paragraph':
		default:
			return block.text ?? '';
	}
}

export function renderAsMarkdown(topic: ContentTopic): string {
	return [`# ${topic.title}`, topic.summary, ...topic.blocks.map(renderBlock)].join('\n\n');
}
