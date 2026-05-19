<script lang="ts">
	let fileinput: any;
	const onFileSelected = async (e: any) => {
		let reader = new FileReader();
		reader.readAsDataURL(e.target.files[0]);
		reader.onload = (e) => {
			base64 = `${e.target!.result}`;
		};
	};
	export let label: string | undefined = undefined;
	export let base64: string | undefined;
	export let acceptedExtensions: string | undefined = undefined;
	export let compact: boolean = false;
	export let buttonLabel: string = 'Upload';
</script>

<div class="flex flex-col relative">
	{#if label}
		<p class="text-secondary-color {compact ? 'text-[10px] opacity-50' : 'text-sm font-medium'} absolute top-[-1.2rem]">{label}</p>
	{/if}
	<div class="flex flex-col items-center">
		<button
			class={`btn border-secondary-color whitespace-nowrap w-full border rounded-sm ${compact ? 'text-xs h-7 px-3' : 'text-md h-10 px-4 xl:text-xl'}`}
			on:click={() => {
				fileinput.click();
			}}
		>
			{buttonLabel}
		</button>
		<input
			style="display:none"
			type="file"
			accept={acceptedExtensions}
			on:change={(e) => onFileSelected(e)}
			bind:this={fileinput}
		/>
	</div>
</div>
