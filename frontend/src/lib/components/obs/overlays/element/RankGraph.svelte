<script lang="ts">
	export let points: number[] = [];
	export let colorUp: string = '#4ade80';
	export let colorDown: string = '#f87171';
	export let preview: boolean = false;

	const PREVIEW_POINTS = [1350, 1420, 1390, 1480, 1510, 1490, 1560, 1617];

	$: pts = preview ? PREVIEW_POINTS : points;
	$: color = pts.length >= 2 && pts[pts.length - 1] >= pts[pts.length - 2] ? colorUp : colorDown;

	function buildPath(data: number[]): string {
		if (data.length < 2) return '';
		const W = 100, H = 100, pad = 4;
		const min = Math.min(...data), max = Math.max(...data);
		const range = max - min || 1;
		const x = (i: number) => pad + (i / (data.length - 1)) * (W - pad * 2);
		const y = (v: number) => H - pad - ((v - min) / range) * (H - pad * 2);

		// Smooth bezier path
		return data.map((v, i) => {
			if (i === 0) return `M${x(0).toFixed(1)},${y(v).toFixed(1)}`;
			const x0 = x(i - 1), y0 = y(data[i - 1]);
			const x1 = x(i), y1 = y(v);
			const cpx = (x0 + x1) / 2;
			return `C${cpx.toFixed(1)},${y0.toFixed(1)} ${cpx.toFixed(1)},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
		}).join(' ');
	}

	$: path = buildPath(pts);

	// Area fill path (close below the line)
	function buildArea(data: number[]): string {
		if (data.length < 2) return '';
		const W = 100, H = 100, pad = 4;
		const min = Math.min(...data), max = Math.max(...data);
		const range = max - min || 1;
		const x = (i: number) => pad + (i / (data.length - 1)) * (W - pad * 2);
		const y = (v: number) => H - pad - ((v - min) / range) * (H - pad * 2);
		const linePart = data.map((v, i) => {
			if (i === 0) return `M${x(0).toFixed(1)},${y(v).toFixed(1)}`;
			const x0 = x(i - 1), y0 = y(data[i - 1]);
			const x1 = x(i), y1 = y(v);
			const cpx = (x0 + x1) / 2;
			return `C${cpx.toFixed(1)},${y0.toFixed(1)} ${cpx.toFixed(1)},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
		}).join(' ');
		return `${linePart} L${x(data.length - 1).toFixed(1)},${(H - pad).toFixed(1)} L${x(0).toFixed(1)},${(H - pad).toFixed(1)} Z`;
	}

	$: areaPath = buildArea(pts);
</script>

{#if path}
<svg class="rank-graph" viewBox="0 0 100 100" preserveAspectRatio="none">
	<defs>
		<linearGradient id="rg-fill-{colorUp.replace('#','')}" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color={color} stop-opacity="0.18" />
			<stop offset="100%" stop-color={color} stop-opacity="0.02" />
		</linearGradient>
	</defs>
	<!-- Area fill -->
	<path d={areaPath} fill="url(#rg-fill-{colorUp.replace('#','')})" />
	<!-- Line -->
	<path d={path} fill="none" stroke={color} stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
	<!-- End dot -->
	{#if pts.length >= 2}
		{@const W = 100} {@const H = 100} {@const pad = 4}
		{@const min = Math.min(...pts)} {@const max = Math.max(...pts)}
		{@const range = max - min || 1}
		{@const lastX = pad + ((pts.length - 1) / (pts.length - 1)) * (W - pad * 2)}
		{@const lastY = H - pad - ((pts[pts.length - 1] - min) / range) * (H - pad * 2)}
		<circle cx={lastX} cy={lastY} r="3.5" fill={color} />
	{/if}
</svg>
{:else if preview}
<svg class="rank-graph" viewBox="0 0 100 100" preserveAspectRatio="none">
	<text x="50" y="55" text-anchor="middle" font-size="12" fill="rgba(255,255,255,0.3)">No data</text>
</svg>
{/if}

<style>
	.rank-graph {
		width: 100%;
		height: 100%;
		overflow: visible;
	}
</style>
