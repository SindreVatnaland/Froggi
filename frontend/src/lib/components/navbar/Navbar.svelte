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
				class="fixed top-0 left-0 h-screen w-16 m-0 flex flex-col background-color-primary bg-opacity-25 border-r-1 border-opacity-25 border-secondary-color justify-between py-4 items-center space-y-4 z-50"
			>
				<div class="w-full flex flex-col gap-2 justify-start h-[20%]">
					<BackButton />
				</div>

				<div class="flex flex-col gap-2 justify-center flex-1">
					<div
						class="h-12 w-12 bg-gray-800 bg-opacity-75 justify-center items-center rounded-2xl p-1"
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
						class="h-100 w-12 bg-gray-800 bg-opacity-75 justify-center items-center rounded-2xl space-y-2 p-1"
					>
						<div
							use:tooltip={{
								content: `<p>Leaderboard</p>`,
								html: true,
								placement: 'right',
								delay: [1000, 0],
								offset: 25,
							}}
						>
							<NavButton click={() => goto('/leaderboard')} disabled={true}>
								<img src="/image/button-icons/leaderboard.png" alt="leaderboard" />
							</NavButton>
						</div>
						<div
							use:tooltip={{
								content: `<p>Replays</p>`,
								html: true,
								placement: 'right',
								delay: [1000, 0],
								offset: 25,
							}}
						>
							<NavButton click={() => goto('/replays')} disabled={true}>
								<img src="/image/button-icons/replay.png" alt="replays" />
							</NavButton>
						</div>
						<div
							use:tooltip={{
								content: `<p>Achievements</p>`,
								html: true,
								placement: 'right',
								delay: [1000, 0],
								offset: 25,
							}}
						>
							<NavButton click={() => goto('/achievements')} disabled={true}>
								<img src="/image/button-icons/trophy.png" alt="achievements" />
							</NavButton>
						</div>
						<div
							use:tooltip={{
								content: `<p>Profile</p>`,
								html: true,
								placement: 'right',
								delay: [1000, 0],
								offset: 25,
							}}
						>
							<NavButton click={() => goto('/profile')} disabled={true}>
								<img src="/image/button-icons/profile.png" alt="profile" />
							</NavButton>
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
						class="h-100 w-12 bg-gray-800 bg-opacity-75 justify-start items-center rounded-2xl space-y-2 p-1"
					>
						<div
							use:tooltip={{
								content: `<p>Support Froggi</p>`,
								html: true,
								placement: 'left',
								delay: [1000, 0],
								offset: 25,
							}}
						>
							<NavButton
								click={() => openUrl('https://buymeacoffee.com/sindrevatnw')}
								style="border-color: #FFDD00; background-color: #FFDD00;"
							>
								<img
									class="object-cover"
									src="/image/icons/buy-me-a-coffee.svg"
									alt="mobile"
								/>
							</NavButton>
						</div>
						<div
							use:tooltip={{
								content: `<p>Join Discord</p>`,
								html: true,
								placement: 'left',
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
								placement: 'left',
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
					</div>
				</div>

				<div class="flex-1 flex flex-col gap-2 justify-center">
					<div
						class="w-12 bg-gray-800 bg-opacity-75 justify-center items-center rounded-2xl space-y-2 p-1"
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
					<NavButton click={() => goto('/leaderboard')} disabled={true}>
						<img src="/image/button-icons/leaderboard.png" alt="leaderboard" />
					</NavButton>
					<NavButton click={() => goto('/achievements')} disabled={true}>
						<img src="/image/button-icons/trophy.png" alt="achievements" />
					</NavButton>
					<NavButton click={() => goto('/profile')}>
						<img src="/image/button-icons/profile.png" alt="profile" />
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
