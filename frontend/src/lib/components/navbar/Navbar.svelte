<script lang="ts">
	import NavButton from '$lib/components/navbar/NavButton.svelte';
	import { fly } from 'svelte/transition';
	import {
		dolphinState,
		electronEmitter,
		isElectron,
		isIframe,
		isMobile,
		isOverlayPage,
		obsConnection,
	} from '$lib/utils/store.svelte';
	import { goto } from '$app/navigation';
	import Mobile from '$lib/components/modal/electron/Mobile.svelte';
	import BackButton from '$lib/components/navbar/BackButton.svelte';
	import ConnectionStateButton from './ConnectionStateButton.svelte';
	import ElectronVersionButton from './ElectronVersionButton.svelte';
	import { tooltip } from 'svooltip';
	import BuyMeACoffee from './BuyMeACoffee.svelte';

	function resetVisibilityTimer() {
		if ($isElectron) {
			isVisible = true;
			return;
		}
		if ($isIframe) {
			isVisible = false;
			return;
		}
		isVisible = true;
		clearInterval(visibilityTimer);
		startVisibilityTimer();
	}

	function startVisibilityTimer() {
		visibilityTimer = setTimeout(
			() => {
				isVisible = false;
			},
			$isMobile ? 5000 : 10000,
		);
	}

	const openUrl = (url: string) => {
		$electronEmitter.emit('OpenUrl', url);
	};

	let visibilityTimer: NodeJS.Timeout;
	let isVisible = !$isOverlayPage && ($isElectron || $isMobile);

	let isMobileOpen: boolean;
	let width: number;
</script>

<svelte:window
	bind:innerWidth={width}
	on:click={resetVisibilityTimer}
	on:touchstart={resetVisibilityTimer}
	on:touchmove={resetVisibilityTimer}
	on:touchend={resetVisibilityTimer}
	on:mousemove={resetVisibilityTimer}
/>

<div>
	{#if isVisible}
		{#if !$isMobile}
			<div
				in:fly={{ x: -100, duration: 150 }}
				out:fly={{ x: -100, duration: 400 }}
				class="fixed top-0 left-0 h-screen w-16 m-0 flex flex-col border-r-1 border-opacity-25 border-secondary-color justify-between py-4 items-center space-y-4 z-50"
			>
				<div class="w-full flex flex-col gap-2 justify-start h-[20%]">
					<BackButton />
				</div>

				<div class="flex flex-col gap-2 justify-center flex-1">
					<div
						class="h-12 w-12 bg-black bg-opacity-30 justify-center items-center rounded-2xl p-1"
					>
						<div
							use:tooltip={{
								content: `<p>Home</p>`,
								html: true,
								placement: 'right',
								delay: [1000, 0],
								offset: 25,
							}}
						>
							<NavButton click={() => goto('/')}>
								<img src="/image/button-icons/home.png" alt="home" />
							</NavButton>
						</div>
					</div>
					<div
						class="h-100 w-12 bg-black bg-opacity-30 justify-center items-center rounded-2xl space-y-2 p-1"
					>
						<div
							use:tooltip={{
								content: `<p>Join Discord</p>`,
								html: true,
								placement: 'right',
								delay: [1000, 0],
								offset: 25,
							}}
						>
							<NavButton click={() => openUrl('https://discord.gg/rX7aQmbrEa')}>
								<img
									class="object-cover"
									src="/image/icons/discord.png"
									alt="mobile"
								/>
							</NavButton>
						</div>
						<div
							use:tooltip={{
								content: `<p>Github</p>`,
								html: true,
								placement: 'right',
								delay: [1000, 0],
								offset: 25,
							}}
						>
							<NavButton
								click={() => openUrl('https://github.com/SindreVatnaland/Froggi')}
							>
								<img
									class="object-cover"
									src="/image/icons/github.png"
									alt="mobile"
								/>
							</NavButton>
						</div>
						<div
							use:tooltip={{
								content: `<p>Support Froggi</p>`,
								html: true,
								placement: 'right',
								delay: [1000, 0],
								offset: 25,
							}}
						>
							<BuyMeACoffee />
						</div>
					</div>
				</div>
				<div class="w-full flex flex-col gap-2 justify-end items-center h-[20%]">
					<ElectronVersionButton />
				</div>
			</div>

			<div
				in:fly={{ x: 100, duration: 150 }}
				out:fly={{ x: 100, duration: 400 }}
				class="fixed top-0 right-0 h-screen w-16 m-0 flex flex-col background-color-primary bg-opacity-25 border-l-1 border-opacity-25 border-secondary-color justify-between py-4 items-center space-y-4 z-50"
			>
				<div class="h-[20%] w-full flex flex-col gap-2 justify-start items-center">
					<div
						class="h-100 w-12 bg-black bg-opacity-30 justify-start items-center rounded-2xl space-y-2 p-1"
					/>
				</div>

				<div class="flex-1 flex flex-col gap-2 justify-center">
					<div
						class="w-12 bg-black bg-opacity-30 justify-center items-center rounded-2xl space-y-2 p-1"
					>
						<ConnectionStateButton
							iconPath="/image/button-icons/obs.png"
							connectionState={$obsConnection.state}
							click={() => goto('/obs')}
						/>
						<div
							use:tooltip={{
								content: `<p>Mobile App</p>`,
								html: true,
								placement: 'left',
								delay: [1000, 0],
								offset: 25,
							}}
						>
							<NavButton click={() => (isMobileOpen = true)}>
								<img src="/image/button-icons/mobile.png" alt="mobile" />
							</NavButton>
						</div>
						<div
							use:tooltip={{
								content: `<p>Settings</p>`,
								html: true,
								placement: 'left',
								delay: [1000, 0],
								offset: 25,
							}}
						>
							<NavButton click={() => goto('/settings')}>
								<img src="/image/button-icons/settings.png" alt="settings" />
							</NavButton>
						</div>
					</div>
				</div>

				<div class="w-full flex flex-col gap-2 justify-end items-center h-[20%]">
					<ConnectionStateButton
						iconPath="/image/button-icons/dolphin.svg"
						class="bg-opacity-10 bg-black"
						connectionState={$dolphinState}
					/>
				</div>
			</div>
		{:else}
			<div
				in:fly={{ y: 100, duration: 150 }}
				out:fly={{ y: 100, duration: 400 }}
				class={`fixed grid justify-center w-screen h-16 m-0 background-color-primary bg-opacity-60 border-t-1 border-opacity-25 bottom-0 border-white z-50 p-1`}
			>
				<div
					class={`flex justify-evenly content-center items-center w-screen ${
						$isMobile ? 'max-w-lg' : 'max-w-xl'
					}`}
				>
					<NavButton click={() => goto('/')}>
						<img src="/image/button-icons/home.png" alt="home" />
					</NavButton>

					<ConnectionStateButton
						iconPath="/image/button-icons/obs.png"
						connectionState={$obsConnection.state}
						click={() => goto('/obs')}
					/>
				</div>
			</div>
		{/if}
	{/if}
</div>

<Mobile bind:open={isMobileOpen} />
