<script lang="ts">
	import Modal from '$lib/components/modal/Modal.svelte';
	import type { CustomElement } from '$lib/models/constants/customElement';
	import ElementCategorySelect from './elementCategories/ElementCategorySelect.svelte';

	export let selectedElementId: CustomElement;
	export let open: boolean = !Boolean(selectedElementId);
</script>

<Modal bind:open on:close={() => (open = false)} class="">
	<div class="w-[80vw] max-w-[860px] h-[70vh] border-secondary background-primary-color flex flex-col overflow-hidden" style="border-radius:0.35rem">
		<ElementCategorySelect bind:selectedElementId bind:open />
	</div>
</Modal>
