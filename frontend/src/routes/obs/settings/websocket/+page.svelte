<script lang="ts">
	import TextInput from '$lib/components/input/TextInput.svelte';
	import { notifications } from '$lib/components/notification/Notifications.svelte';
	import { ObsAuth } from '$lib/models/types/obsTypes';
	import { electronEmitter, obs } from '$lib/utils/store.svelte';
	import { cloneDeep } from 'lodash';

	const defaultAuth = { ipAddress: 'localhost', port: '4455', password: '' };
	let authValidator = { ipAddress: false, port: false, password: false };

	let auth = cloneDeep(defaultAuth);

	const isValidIpAddress = (ipAddress: string) => {
		const ipv4Regex =
			/^(localhost|(?:25[0-5]|2[0-4]\d|[01]?\d?\d)0–255(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d?\d)){3})$/;
		return ipv4Regex.test(ipAddress);
	};

	const handleIpAddressChange = (event: CustomEvent<string>) => {
		const ipAddress = event.detail.trim();
		auth.ipAddress = ipAddress;
	};

	const isValidPort = (port: string) => {
		const portRegex = /^(0|[1-9]\d{0,4})$/;
		return portRegex.test(port.toString()) && Number(port) <= 65535;
	};

	const handlePortChange = (event: CustomEvent<string>) => {
		const port = event.detail.trim();
		auth.port = port;
	};

	const isValidInputs = () => {
		return Object.values(authValidator).every((value) => value);
	};

	const validateAuth = (auth: ObsAuth) => {
		authValidator = {
			ipAddress: isValidIpAddress(auth.ipAddress),
			port: isValidPort(auth.port),
			password: typeof auth.password === 'string',
		};
	};
	$: validateAuth(auth);

	const connect = () => {
		if (!isValidInputs()) {
			notifications.danger('Invalid Inputs', 3000);
			return;
		}
		$electronEmitter.emit('ObsManualConnect', auth);
	};

	const resetToDefault = () => {
		auth = cloneDeep(defaultAuth);
	};
</script>

<div class="w-full max-w-[25rem] justify-center items-center item flex flex-col gap-4">
	<h1 class="text-2xl color-secondary">Websocket Settings</h1>

	<div class={`flex flex-col gap-2 p-2 `}>
		<h1
			class={`text-xl font-semibold text-nowrap ${
				!authValidator.ipAddress ? 'color-secondary' : 'text-success-color'
			}`}
		>
			Local Ip Address:
		</h1>
		<TextInput
			value={auth?.ipAddress ?? ''}
			on:change={handleIpAddressChange}
			placeholder="127.0.0.1"
		/>
	</div>
	<div class="flex flex-col gap-2 p-2">
		<h1
			class={`text-xl font-semibold text-nowrap ${
				!authValidator.port ? 'color-secondary' : 'text-success-color'
			}`}
		>
			Port:
		</h1>
		<TextInput value={`${auth?.port}`} on:change={handlePortChange} placeholder="4455" />
	</div>
	<div class="flex flex-col gap-2 p-2">
		<h1
			class={`text-xl font-semibold text-nowrap ${
				!authValidator.password ? 'color-secondary' : 'text-success-color'
			}`}
		>
			Password:
		</h1>
		<TextInput
			value={auth.password}
			on:change={(e) => (auth.password = e.detail)}
			placeholder="password123"
		/>
	</div>
	<button class="p-2 border-secondary" on:click={connect}>
		<h1 class="color-secondary text-xl font-semibold">Connect</h1>
	</button>
	<hr />
	<button class="p-2 border-secondary" on:click={resetToDefault}>
		<h1 class="color-secondary text-xl font-semibold">Reset To Default</h1>
	</button>
</div>
