<script setup lang="js">

    const route = useRoute()
    const nuxtApp = useNuxtApp()
    const viewport = nuxtApp.$viewport
    const devIP = import.meta.env.VITE_DEV_IP

    const toast = useToast()

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

    const searchTerm = ref()
    const searchTermModal = ref()

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

    function dropdownItems (name, id) {
        return [
                    {
                         label: 'Usuń',
                         icon: 'material-symbols:delete-outline',
                         color: 'error',
                         onSelect() {
                             console.log(name, id)
                             confirmModalDelete(name, id)
                         }
                     }
                ]
    }

    const addItemModalState = ref(false)
    async function addItem(id) {
        addItemModalState.value = false
        try {
            $fetch(`http://${devIP}:3003/api/project/addNewelement`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    ...useRequestHeaders(['cookie'])
                },
                body: {
                    projectID: route.params.id,
                    productID: id,
                    number: 1
                },
                server: false,
                credentials: 'include'
            })
            await refreshItems()
        } catch (error) {
            console.log(error.message)
        }
    }
    let confirmoModalItem = null
    let tempModalItemID = null
    const confirmModalState = ref(false)
    async function confirmModalDelete(title, itemID) {
        confirmModalState.value = true
        confirmoModalItem = title
        tempModalItemID = itemID
    }

    async function removeItem(id) {
        try {
            $fetch(`http://${devIP}:3003/api/project/deleteItem`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    ...useRequestHeaders(['cookie'])
                },
                body: {
                    projectID: route.params.id,
                    productID: id
                },
                server: false,
                credentials: 'include'
            })
            confirmModalState.value = false
            await refreshItems()
            toast.add({
                title: "Sukces!",
                description: 'Pomyślnie usunięto przedmiot.',
                color: 'success'
            })
        } catch (error) {
            console.log(error.message)
        }
    }

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
                                            <UDropdownMenu :items="dropdownItems(item.label, item.value)" class="flex absolute right-4 sm:r-6">
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
                                <UListbox :items="allItems" v-model:search-term="searchTermModal" filter>
<!--                                    Trzeba zrobić kursor disabled i dodać dodwananie przedmiotów i skończyć usówanie-->
                                    <template #item="{ item }">
                                        <div class="w-[100%] h-max" @click="!item.disabled ? addItem(item.value) : null">
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
            <UModal color="neutral" variant="subtle" v-model:open="confirmModalState" class="p-4 w-[80%]">
                <template #content class="flex justify-center">
                    <div class="mb-5 justify-center pb-2">Czy na pewno chcesz usunąć przedmiot o nazwie: "{{confirmoModalItem}}"</div>
                    <div class="flex justify-center">
                        <UButton class="w-15 ml-3 mp-3 justify-center" color="error" @click="removeItem(tempModalItemID)" loading-auto :dismissible="false" non-dismissible>Tak</UButton><UButton class="w-15 ml-3 mp-3 justify-center" color="success" @click="closeConfirmModal()">Nie</UButton>
                    </div>
                </template>
            </UModal>
        </ClientOnly>
    <UFooter>

    </UFooter>
</template>
