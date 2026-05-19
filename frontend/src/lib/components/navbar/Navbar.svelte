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

	// Non-overlay pages: Electron always on, browser timer-based.
	// Overlay pages: timer-based for both (auto-hide, reveal on activity).
	let isVisible = $isMobile;
	let visibilityTimer: ReturnType<typeof setTimeout>;

	function startHideTimer() {
		clearTimeout(visibilityTimer);
		visibilityTimer = setTimeout(() => {
			isVisible = false;
		}, $isMobile ? 5000 : 4000);
	}

	function onActivity() {
		if ($isIframe) return;
		if ($isElectron && !$isOverlayPage) return;
		isVisible = true;
		startHideTimer();
	}

	const openUrl = (url: string) => {
		$electronEmitter.emit('OpenUrl', url);
	};

	let isMobileOpen: boolean;
	let width: number;
	let height: number;

	$: isVertical = width < height;

	// On overlay pages: timer-based for both. On other pages: Electron always on.
	$: showNav = $isOverlayPage ? isVisible : ($isElectron || isVisible);
</script>

<svelte:window
	bind:innerWidth={width}
	bind:innerHeight={height}
	on:click={onActivity}
	on:touchstart={onActivity}
	on:touchmove={onActivity}
	on:touchend={onActivity}
	on:mousemove={onActivity}
/>

{#if showNav}
	{#if !isVertical}
		<!-- Left sidebar -->
		{#if $isElectron}
			<div
				class="fixed top-0 left-0 h-screen w-16 m-0 flex flex-col border-r border-secondary-color justify-between py-4 items-center space-y-4 z-50 background-primary-color"
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
								<img class="object-cover" src="/image/icons/discord.png" alt="discord" />
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
								<img class="object-cover" src="/image/icons/github.png" alt="github" />
							</NavButton>
						</div>
					</div>
				</div>
				<div class="w-full flex flex-col gap-2 justify-end items-center h-[20%]">
					<ElectronVersionButton />
				</div>
			</div>
		{:else}
			<!-- Browser: animate in/out -->
			<div
				in:fly={{ x: -100, duration: 150 }}
				out:fly={{ x: -100, duration: 400 }}
				class="fixed top-0 left-0 h-screen w-16 m-0 flex flex-col border-r border-secondary-color justify-between py-4 items-center space-y-4 z-50 background-primary-color"
			>
				<div class="w-full flex flex-col gap-2 justify-start h-[20%]">
					<BackButton />
				</div>
				<div class="flex flex-col gap-2 justify-center flex-1">
					<div class="h-12 w-12 bg-black bg-opacity-30 justify-center items-center rounded-2xl p-1">
						<NavButton click={() => goto('/')}>
							<img src="/image/button-icons/home.png" alt="home" />
						</NavButton>
					</div>
				</div>
			</div>
		{/if}

		<!-- Right sidebar -->
		{#if $isElectron}
			<div
				class="fixed top-0 right-0 h-screen w-16 m-0 flex flex-col background-primary-color border-l border-secondary-color justify-between py-4 items-center space-y-4 z-50"
			>
				<div class="h-[20%] w-full flex flex-col gap-2 justify-start items-center">
					<div class="h-100 w-12 bg-black bg-opacity-30 justify-start items-center rounded-2xl space-y-2 p-1" />
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
				in:fly={{ x: 100, duration: 150 }}
				out:fly={{ x: 100, duration: 400 }}
				class="fixed top-0 right-0 h-screen w-16 m-0 flex flex-col background-primary-color border-l border-secondary-color justify-between py-4 items-center space-y-4 z-50"
			>
				<div class="flex-1 flex flex-col gap-2 justify-center">
					<div class="w-12 bg-black bg-opacity-30 justify-center items-center rounded-2xl space-y-2 p-1">
						<ConnectionStateButton
							iconPath="/image/button-icons/obs.png"
							connectionState={$obsConnection.state}
							click={() => goto('/obs')}
						/>
						<NavButton click={() => goto('/settings')}>
							<img src="/image/button-icons/settings.png" alt="settings" />
						</NavButton>
					</div>
				</div>
			</div>
		{/if}
	{:else}
		<!-- Mobile / portrait: bottom bar -->
		<div
			in:fly={{ y: 100, duration: 150 }}
			out:fly={{ y: 100, duration: 400 }}
			class={`fixed grid justify-center w-screen h-16 m-0 background-primary-color bg-opacity-60 border-t border-secondary-color bottom-0 z-50 p-1 background-primary-color`}
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

				<NavButton click={() => goto('/settings')}>
					<img src="/image/button-icons/settings.png" alt="settings" />
				</NavButton>
			</div>
		</div>
	{/if}
{/if}

<Mobile bind:open={isMobileOpen} />
