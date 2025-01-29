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
</script>

<div class="flex flex-col relative">
	{#if label}
		<p class="text-secondary-color text-sm font-medium absolute top-[-1.2rem]">{label}</p>
	{/if}
	<div class="flex flex-col items-center">
		<button
			class={`transition background-color-primary px-4 border-secondary-color bg-opacity-25 hover:bg-opacity-40  font-semibold text-secondary-color text-md whitespace-nowrap h-10 w-full xl:text-xl border rounded`}
			on:click={() => {
				fileinput.click();
			}}
		>
			Upload
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
