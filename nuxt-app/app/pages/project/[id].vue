<script setup lang="js">

    import PricingList from "~/components/PricingList.vue";

    const route = useRoute()
    const nuxtApp = useNuxtApp()
    const viewport = nuxtApp.$viewport
    const devIP = import.meta.env.VITE_DEV_IP

    const toast = useToast()
    const VAT = 23
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
                value: e.id,
                amount: e.number,
                price: e.price,
                currency: e.currency
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
    const columns = [
        {
            accessorKey: 'name',
            header: 'Nazwa',
        },
        {
            accessorKey: 'amount',
            header: 'Ilość',
        },
        {
            accessorKey: 'price',
            header: 'Cena jedn.',
        },
        {
            accessorKey: 'total',
            header: 'Razem',
        },
    ]
    const pricingListData = computed(() => {
        if (!projectItems?.value) return []
        const items = []
        let summedPrice = 0
        projectItems.value.forEach((e) => {
            const lineTotal = e.amount * e.price
            items.push({
                id: e.value,
                name: e.label,
                price: `${e.price} ${e.currency}`,
                amount: e.amount,
                total: `${lineTotal} ${e.currency}`,
                _rawTotal: lineTotal
            })
            summedPrice += lineTotal
        })

        const vatAmount = summedPrice * (VAT / 100)
        const grandTotal = summedPrice + vatAmount

        items.push({
            id: 'total',
            name: `Suma z VAT ${VAT}%`,
            price: null,
            amount: null,
            total: `${grandTotal.toFixed(2)} EUR`,
            _rawTotal: grandTotal
        })
        console.log(summedPrice)
        return items
    })
    console.log('ghosndgdls: ', pricingListData.value)
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
            await $fetch(`http://${devIP}:3003/api/project/addNewelement`, {
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
                color: 'success',
                duration: 2000
            })
        } catch (error) {
            console.log(error.message)
        }
    }

    const activeDesktopTab = ref("items")
</script>
<template>
        <ClientOnly>
            <div v-if="$viewport.isLessThan('tablet')" class="print:hidden">
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
                                <template #empty class="flex">
                                    <div class="pb-1">Brak przedmiotów.</div>
                                    <UButton variant="outline" @click="addItemModalState = true">Dodaj</UButton>
                                </template>
                            </UListbox>
                        </template>
                        <template #pricinglist>
                            <UTable :data="pricingListData" :columns="columns" class="flex-1">
                            </UTable>
                        </template>
                    </UTabs>
                </div>
            </div>
            <div v-else class="fixed inset-0 flex overflow-hidden print:hidden">

                <aside class="w-56 shrink-0 flex flex-col border-r border-default bg-background">
                    <div class="px-4 py-5 border-b border-default">
                        <div class="text-xs font-semibold uppercase tracking-widest text-muted mb-1">Projekt</div>
                        <div class="text-base font-bold truncate">{{ projectData?.name ?? '—' }}</div>
                    </div>
                    <nav class="flex flex-col gap-1 p-3 flex-1">
                        <button
                            v-for="tab in tabItems"
                            :key="tab.slot"
                            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left"
                            :class="activeDesktopTab === tab.slot
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted hover:bg-elevated hover:text-default'"
                            @click="activeDesktopTab = tab.slot"
                        >
                            <UIcon :name="tab.icon" class="w-4 h-4 shrink-0" />
                            {{ tab.label }}
                        </button>
                    </nav>
                </aside>

                <div class="flex flex-col flex-1 min-w-0 overflow-hidden">

                    <header class="flex items-center gap-4 px-6 py-4 border-b border-default shrink-0 sticky top-0 z-10 bg-background">
                        <div class="flex-1">
                            <h1 class="text-lg font-semibold">
                                {{ tabItems.find(t => t.slot === activeDesktopTab)?.label }}
                            </h1>
                            <p v-if="activeDesktopTab === 'items'" class="text-xs text-muted mt-0.5">
                                {{ projectItems.length }} {{ projectItems.length === 1 ? 'przedmiot' : 'przedmiotów' }}
                            </p>
                        </div>
                        <UInput
                            v-if="activeDesktopTab === 'items'"
                            v-model="searchTerm"
                            icon="lucide:search"
                            placeholder="Szukaj przedmiotów…"
                            class="w-64"
                            size="sm"
                        />
                        <UButton
                            v-if="activeDesktopTab === 'items'"
                            icon="lucide:plus"
                            size="sm"
                            @click="addItemModalState = true"
                        >
                            Dodaj przedmiot
                        </UButton>
                    </header>

                    <div class="flex-1 overflow-y-auto">

                        <template v-if="activeDesktopTab === 'items'">
                            <div v-if="projectItems.length === 0" class="flex flex-col items-center justify-center h-full gap-3 text-muted">
                                <UIcon name="material-symbols:inventory-2-outline" class="w-12 h-12 opacity-30" />
                                <p class="text-sm">Brak przedmiotów w tym projekcie.</p>
                                <UButton variant="outline" size="sm" @click="addItemModalState = true">Dodaj pierwszy przedmiot</UButton>
                            </div>

                            <table v-else class="w-full text-sm">
                                <thead>
                                <tr class="border-b border-default text-left">
                                    <th class="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-muted w-10">#</th>
                                    <th class="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Nazwa</th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr
                                    v-for="(item, index) in projectItems.filter(i =>
                                !searchTerm || i.label.toLowerCase().includes(searchTerm.toLowerCase())
                            )"
                                    :key="item.value"
                                    class="border-b border-default hover:bg-elevated transition-colors"
                                >
                                    <td class="px-6 py-4 text-muted tabular-nums">{{ index + 1 }}</td>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-3">
                                            <UIcon :name="item.icon" class="w-4 h-4 text-muted shrink-0" />
                                            <span class="font-medium">{{ item.label }}</span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-right">
                                        <UDropdownMenu :items="dropdownItems(item.label, item.value)" class="hover:bg-[#FFFFFF1F]">
                                            <UButton
                                                icon="lucide:more-horizontal"
                                                color="neutral"
                                                variant="ghost"
                                                size="xs"
                                            />
                                        </UDropdownMenu>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </template>
                        <template v-else-if="activeDesktopTab === 'pricinglist'">
                            <div class="flex-1 overflow-y-auto">
                                <UTable
                                    :data="pricingListData"
                                    :columns="columns"
                                    class="w-full"
                                    :ui="{
                thead: 'sticky top-0 bg-background z-10',
                th: 'px-6 py-3 text-xs font-semibold uppercase tracking-wide text-muted',
                td: 'px-6 py-4',
                tr: 'border-b border-default hover:bg-elevated transition-colors',
            }"
                                />
                            </div>
                        </template>

                        <template v-else-if="activeDesktopTab === 'data'">
                            <div class="flex flex-col items-center justify-center h-full gap-3 text-muted">
                                <UIcon name="material-symbols:work-outline" class="w-12 h-12 opacity-30" />
                                <p class="text-sm">Dane projektu – wkrótce dostępne.</p>
                            </div>
                        </template>

                    </div>
                </div>
            </div>
            <UModal color="neutral" variant="subtle" v-model:open="addItemModalState" class="p-4 w-[80%] divide-y-0 print:hidden" @submit.prevent="addProject">
                <template #content class="flex justify-center">
                    <div class="pb-3 justify-center w-full text-center">Dodaj nowy przedmiot:</div>
                    <UForm>
                        <div class="text-center">
                            <UFormField name="projectName">
                                <UListbox :items="allItems" v-model:search-term="searchTermModal" filter>
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
            <div class="fixed  left-[85%] top-[92%] z-100 md:hidden print:hidden" >
                <UButton icon="lucide:plus" class="p-4" @click="addItemModalState = true" >

                </UButton>
            </div>
            <UModal color="neutral" variant="subtle" v-model:open="confirmModalState" class="p-4 w-[80%] print:hidden">
                <template #content class="flex justify-center">
                    <div class="mb-5 justify-center pb-2">Czy na pewno chcesz usunąć przedmiot o nazwie: "{{confirmoModalItem}}"</div>
                    <div class="flex justify-center">
                        <UButton class="w-15 ml-3 mp-3 justify-center" color="error" @click="removeItem(tempModalItemID)" loading-auto :dismissible="false" non-dismissible>Tak</UButton><UButton class="w-15 ml-3 mp-3 justify-center" color="success" @click="confirmModalState = false">Nie</UButton>
                    </div>
                </template>
            </UModal>
        </ClientOnly>
    <div class="hidden print:block">
        <PricingList :products="projectItems"></PricingList>
    </div>
    <UFooter class="print:hidden">

    </UFooter>
</template>
