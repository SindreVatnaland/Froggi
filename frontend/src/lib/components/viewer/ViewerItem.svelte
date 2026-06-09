<script lang="ts">
	/**
	 * Item / projectile render, ported from SlippiLab (MIT) `src/components/viewer/Item.tsx`.
	 * Coordinates and sizes from hitboxspace are divided by 256 to reach worldspace.
	 * Renders inside the same SVG world-space group as the characters.
	 */
	import { itemNamesById } from '$lib/utils/viewer/ids';
	import type { MinimalItem } from '$lib/utils/viewer/renderData';

	export let item: MinimalItem;
	/** Optional owner position for held items (turnip/egg at state 0). */
	export let ownerX: number | null = null;
	export let ownerY: number | null = null;

	$: name = itemNamesById[item.typeId ?? -1];
	$: x = item.positionX ?? 0;
	$: y = item.positionY ?? 0;

	const samusChargeHitbox = [300, 400, 500, 600, 700, 800, 900, 1200];

	// Laser hitbox chains: angle by velocity, mirror by facing.
	// NOTE: `it` is passed in (not closed over) so the reactive statements below
	// list `item` as a dependency — otherwise the points never recompute and the
	// laser renders frozen at its first position.
	function laser(it: MinimalItem, offsets: number[], byFacing: boolean) {
		const lx = it.positionX ?? 0;
		const ly = it.positionY ?? 0;
		const dir = Math.atan2(it.velocityY ?? 0, it.velocityX ?? 0);
		const cos = Math.cos(dir);
		const sin = Math.sin(dir);
		const facing = byFacing ? it.facingDirection ?? 1 : 1;
		return offsets.map((o) => [lx + (o / 256) * facing * cos, ly + (o / 256) * facing * sin]);
	}
	$: foxLaserPts = name === "Fox's Laser" ? laser(item, [-200, -933, -1666], true) : [];
	$: falcoLaserPts = name === "Falco's Laser" ? laser(item, [-200, -933, -1666, -2400], false) : [];
	$: laserSize = 300 / 256;
	$: heldX = item.state === 0 && ownerX !== null ? ownerX : x;
	$: heldY = item.state === 0 && ownerY !== null ? ownerY + 8 : y;
</script>

{#if name === 'Needle(thrown)'}
	<circle cx={x} cy={y} r={500 / 256} fill="darkgray" />
{:else if name === "Fox's Laser"}
	<line x1={foxLaserPts[0]?.[0]} y1={foxLaserPts[0]?.[1]} x2={foxLaserPts[2]?.[0]} y2={foxLaserPts[2]?.[1]} stroke="red" />
	{#each foxLaserPts as p}<circle cx={p[0]} cy={p[1]} r={laserSize} fill="red" />{/each}
{:else if name === "Falco's Laser"}
	<line x1={falcoLaserPts[0]?.[0]} y1={falcoLaserPts[0]?.[1]} x2={falcoLaserPts[3]?.[0]} y2={falcoLaserPts[3]?.[1]} stroke="red" />
	{#each falcoLaserPts as p}<circle cx={p[0]} cy={p[1]} r={laserSize} fill="red" />{/each}
{:else if name === 'Turnip'}
	<circle cx={heldX} cy={heldY} r={600 / 256} fill="darkgray" opacity={item.state === 0 ? 0.5 : 1} />
{:else if name === "Yoshi's egg(thrown)"}
	<circle cx={heldX} cy={heldY} r={item.state === 2 ? 2500 / 256 : 1000 / 256} fill="darkgray" opacity={item.state === 1 ? 1 : 0.5} />
{:else if name === "Luigi's fire"}
	<circle cx={x} cy={y} r={500 / 256} fill="darkgray" />
{:else if name === "Mario's fire"}
	<circle cx={x} cy={y} r={600 / 256} fill="darkgray" />
{:else if name === 'Missile'}
	<circle cx={x} cy={y} r={((item.missileType ?? 0) === 0 ? 500 : 600) / 256} fill="darkgray" />
{:else if name === "Samus's bomb"}
	<circle cx={x} cy={y} r={(item.state === 3 ? 1536 : 500) / 256} fill="darkgray" />
{:else if name === "Samus's chargeshot"}
	<circle cx={x} cy={y} r={(samusChargeHitbox[item.chargePower ?? 0] ?? 300) / 256} fill="darkgray" />
{:else if name === 'Shyguy (Heiho)'}
	<circle cx={x} cy={y} r={5 * 0.85} fill="#aa0000" />
{/if}
