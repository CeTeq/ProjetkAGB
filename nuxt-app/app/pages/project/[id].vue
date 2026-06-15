<script setup lang="js">
    const route = useRoute()
    const nuxtApp = useNuxtApp()
    const viewport = nuxtApp.$viewport
    const devIP = import.meta.env.VITE_DEV_IP

    watch(viewport.breakpoint, function (newBreakpoint, oldBreakpoint) {
        console.log('Breakpoint updated:', oldBreakpoint, '->', newBreakpoint)
    })

    const { data: projectData, errorProjectData, refresh: refreshItems } = await useFetch('http://' + devIP + ':3003/api/project', {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
            ...useRequestHeaders(['cookie'])
        },
        query: {
            id: route.params.id
        },
        server: false,
        credentials: 'include'
    });

    const projectItems = computed(() => {
        if (!projectData.value?.items) return []
        const items = []
        projectData.value.items.forEach((e) => {
            items.push({
                label: e.name,
                icon: 'material-symbols:package-2',
                value: e.id
            })
        })
        return items
    })

    const { data: allItemsData, errorAllItems} = await useFetch(`http://${devIP}:3003/api/getProducts`, {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
            ...useRequestHeaders(['cookie'])
        },
        server: false,
        credentials: 'include'
    })

    const allItems =  computed(() => {
        if (!allItemsData.value) return []
        const items = []
        allItemsData.value.forEach((e) => {
            items.push({
                label: e.name,
                icon: 'material-symbols:package-2',
                value: e.id,
                disabled: projectItems.value.some((el) => el.value === e.id)
            })
        })
        return items
    })

    watch(errorAllItems, (newError) => {
        toast.add({
            title: "Error",
            description: "Cannot fetch items.",
            color: "danger",
        });
    })

    watch(errorProjectData, (newError) => {
        toast.add({
            title: "Error",
            description: "Cannot fetch projects.",
            color: "danger",
        });
    })

    const items = ref([
        {
            label: 'France',
            icon: 'i-lucide-map-pin',
            value: 'FR'
        }
    ])
    const searchTerm = ref()

    const tabItems = computed(() => [
        {
            label: "Przedmioty",
            icon: "material-symbols:inventory-2-outline",
            slot: "items",
        },
        {
            label: "Cennik",
            icon: "material-symbols:price-change-outline-rounded",
            slot: "pricinglist",
        },
        {
            label: "Dane",
            icon: "material-symbols:work-outline",
            slot: "data"
        }
    ]);

    function dropdownItems (id) {
        return [
                    {
                         label: 'Usuń',
                         icon: 'material-symbols:delete-outline',
                         color: 'error',
                         onSelect() {
                             console.log(id)
                         }
                     }
                ]
    }

    const addItemModalState = ref(false)

</script>
<template>
        <ClientOnly>
            <div v-if="$viewport.isLessThan('tablet')">
                <div class="min-h-screen">
                    <UTabs
                        :items="tabItems"
                        :ui="{ trigger: 'grow' }"
                        variant="link"
                        class="gap-4 w-full sticky top-0 z-50"
                    >
                        <template #items class="p-1">
                            <UListbox class="w-[99%] mt-3 border-b-0" selected-icon="''" :items="projectItems" v-model:search-term="searchTerm" filter :ui="{
                                item: 'p-6 border-b border-default',
                                content: 'h-full max-h-none overflow-y-auto'
                            }">
                                <template #item="{ item }">
                                    <div>
                                        <UIcon :name="item.icon" class="w-5 h-5" />
                                        <div class="flex flex-col">
                                            <span class="font-semibold">{{ item.label }}</span>
                                            <UDropdownMenu :items="dropdownItems(item.value)" class="flex absolute right-4 sm:r-6">
                                                <UButton icon="lucide:more-vertical" color="neutral" variant="ghost" class="w-fit ml-auto z-10 hover:bg-[#FFFFFF1F]"/>
                                            </UDropdownMenu>
                                        </div>
                                    </div>
                                </template>
                            </UListbox>
                        </template>
                        <template #pricingList>

                        </template>
                    </UTabs>
                </div>
            </div>
            <UModal color="neutral" variant="subtle" v-model:open="addItemModalState" class="p-4 w-[80%] divide-y-0" @submit.prevent="addProject">
                <template #content class="flex justify-center">
                    <div class="pb-3 justify-center w-full text-center">Dodaj nowy przedmiot:</div>
                    <UForm>
                        <div class="text-center">
                            <UFormField name="projectName">
                                <UListbox :items="allItems" v-model:search-term="searchTerm" filter>
                                    <template #item="{ item }">
                                        <div>
                                            <span>{{item.name}}</span>
                                            <div class="flex flex-col">
                                                <span class="font-semibold">{{ item.label }}</span>
                                            </div>
                                        </div>
                                    </template>
                                </UListbox>
                            </UFormField>
                        </div>
                    </UForm>
                </template>
            </UModal>
            <div class="fixed  left-[85%] top-[92%] z-100">
                <UButton icon="lucide:plus" class="p-4" @click="addItemModalState = true">

                </UButton>
            </div>
        </ClientOnly>
    <UFooter>

    </UFooter>
</template>
