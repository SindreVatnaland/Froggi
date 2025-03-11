import type { ElectronLog } from 'electron-log';
import Store from 'electron-store';

export const migrateStore = (log: ElectronLog): Store.Options<Record<string, unknown>> => {
	log.info('Initializing Migrations');
	return {
		beforeEachMigration: (_, context) => {
			log.info(`Migrate store from ${context.fromVersion} → ${context.toVersion}`);
			log.info(context);
		},
		migrations: {
			'>=0.2.0': (store) => {
				log.info('>= 0.1.6');
				store.delete('obs');
			},
			'>=0.4.17': (store) => {
				store.delete('obs');
				store.delete('commands');
				store.delete('stats');
			},
			'>=0.6.15': (store) => {
				store.delete('obs.layout.overlays')
			},
			'>=0.9.15': (store) => {
				store.delete("player")
			},
		},
	};
};
