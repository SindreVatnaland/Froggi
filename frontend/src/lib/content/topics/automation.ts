import type { ContentTopic } from '../types';

export const automationTopics: ContentTopic[] = [
	{
		id: 'automation-overview',
		title: 'Automating OBS from Froggi',
		category: 'automation',
		summary: 'Two ways to trigger OBS actions automatically: a physical controller button combo, or a Froggi game-state change (e.g. the game ending).',
		blocks: [
			{
				type: 'list',
				text: 'Two trigger types:',
				items: [
					'Controller combo — hold a set of buttons on your GameCube controller (e.g. L+R+Start) to fire an OBS action instantly',
					'Game-state trigger — an OBS action fires automatically when Froggi\'s tracked game state reaches a given scene (Menu, In Game, Post Game, Post Set, Rank Change, Strike Phase, Waiting for Dolphin)',
				],
			},
			{
				type: 'paragraph',
				text: 'Both map to the same set of OBS actions: switch the current program scene, save the replay buffer, set an input\'s volume, or toggle a scene item\'s visibility. "Switch OBS scene to Menu when the game ends" is a game-state trigger on the Post Game scene; "switch to my Game scene when I press L+R+Start" is a controller combo.',
			},
			{
				type: 'note',
				text: 'Each trigger type can be checked for existing bindings before adding a new one, so you don\'t accidentally rebind a combo or double up a trigger on the same scene.',
			},
		],
	},
];
