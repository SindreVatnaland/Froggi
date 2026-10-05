import { pickForFormat } from '../../frontend/src/lib/utils/commandFormat';

describe('pickForFormat (Global / Singles / Doubles commands)', () => {
	const global = { id: 'g', format: 'any' as const };
	const legacy: { id: string; format?: 'any' | 'singles' | 'doubles' } = { id: 'old' }; // saved before formats existed = Global
	const singles = { id: 's', format: 'singles' as const };
	const doubles = { id: 'd', format: 'doubles' as const };

	it('Global runs when nothing overrides it', () => {
		expect(pickForFormat([global, legacy], false).map((c) => c.id)).toEqual(['g', 'old']);
		expect(pickForFormat([global, singles], true).map((c) => c.id)).toEqual(['g']);
	});
	it('a format-specific command replaces Global for that format', () => {
		expect(pickForFormat([global, singles, doubles], false).map((c) => c.id)).toEqual(['s']);
		expect(pickForFormat([global, singles, doubles], true).map((c) => c.id)).toEqual(['d']);
	});
});
