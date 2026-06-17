<script setup>

import {navigateTo} from "#app";

const nuxtApp = useNuxtApp()
const $viewport = nuxtApp.$viewport
const devIP = import.meta.env.VITE_DEV_IP
const activeDesktopTab = ref("projects")

watch($viewport.breakpoint, function (newBreakpoint, oldBreakpoint) {
    console.log('Breakpoint updated:', oldBreakpoint, '->', newBreakpoint)
})

const route = useRoute();
const toast = useToast();

const items = computed(() => [
    {
        label: "Projekty",
        icon: "material-symbols:work-outline",
        slot: "projects",
    },
    {
        label: "Zarchiwizowane",
        icon: "material-symbols:inventory-2-outline",
        slot: "archived",

    },
]);

const { data: projectsData, error, refresh: refreshProjects } = await useFetch('http://' + devIP + ':3003/api/getProjects', {
    method: 'GET',
    headers: {
        "Content-Type": "application/json",
        ...useRequestHeaders(['cookie'])
    },
    server: false,
    credentials: 'include'
});

watch(error, (newError) => {
    toast.add({
        title: "Error",
        description: "Cannot fetch projects.",
        color: "danger",
    });
})

const addProjectModalState = ref(false)

async function addProject() {
    if (!state.projectName) return;
    try {
        const response = await $fetch('http://' + devIP + ':3003/api/createProject', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                ...useRequestHeaders(['cookie'])
            },
            body: {
                projectName: state.projectName
            },
            server: false,
            credentials: 'include'

        })
        await refreshProjects()
        addProjectModalState.value = false
        toast.add({
            title: 'Sukces!',
            description: "Pomyślnie utworzono projekt",
            color: 'success'
        })
        navigateTo(`/project/${projectsData.value[projectsData.value.length - 1].id}`)

    } catch (error) {
        console.log(error)
        toast.add({
            title: 'Error!',
            description: ' Nie udało się utworzyć projektu.',
            color: 'error'
        })
    }
}
const state = reactive({
    projectName: undefined
});
function validate() {
    const errors = []
    if (!state.projectName) errors.push({name: 'projectName', message: 'Required'})
    return errors
}
function isFormValid() {
    return !state.projectName
}
</script>

<template>
    <UApp>
        <div v-if="$viewport.isLessThan('tablet')">
            <UTabs
                :items="items"
                :ui="{ trigger: 'grow' }"
                variant="link"
                class="gap-4 w-full"
            >
                <template #projects="{ item }" class="cursor-pointer">
                    <ProjectsList :projects="projectsData" :archived="false" :desktop="false" @refresh="refreshProjects">
                    </ProjectsList>
                    <div class="fixed  left-[85%] top-[92%] z-100">
                        <UButton icon="lucide:plus" class="p-4 md:hidden" @click="addProjectModalState = true">

                        </UButton>
                    </div>
                </template>
                <template #archived="{ item }" class="cursor-pointer">
                    <ProjectsList :projects="projectsData" :archived="true" :desktop="false" @refresh="refreshProjects"></ProjectsList>
                </template>
            </UTabs>
        </div>
        <div v-else class="fixed inset-0 flex flex-col overflow-hidden">
            <header class="flex items-center gap-4 px-6 py-4 border-b border-default shrink-0 bg-background">
                <div class="flex-1">
                    <h1 class="text-lg font-semibold">
                        {{ items.find(i => i.slot === activeDesktopTab)?.label }}
                    </h1>
                    <p class="text-xs text-muted mt-0.5">
                        {{ projectsData?.filter(p => activeDesktopTab === 'projects' ? p.archived === 1 : p.archived === 2).length }} projektów
                    </p>
                </div>
                <UButton
                    v-if="activeDesktopTab === 'projects'"
                    icon="lucide:plus"
                    size="sm"
                    @click="addProjectModalState = true"
                >
                    Nowy projekt
                </UButton>
            </header>

            <nav class="flex gap-1 px-6 py-2 border-b border-default shrink-0 bg-background">
                <button
                    v-for="tab in items"
                    :key="tab.slot"
                    class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    :class="activeDesktopTab === tab.slot
                ? 'bg-primary/10 text-primary'
                : 'text-muted hover:bg-elevated hover:text-default'"
                    @click="activeDesktopTab = tab.slot"
                >
                    <UIcon :name="tab.icon" class="w-4 h-4 shrink-0" />
                    {{ tab.label }}
                </button>
            </nav>

            <div class="flex-1 overflow-y-auto px-6 py-6">
                <ProjectsList
                    :projects="projectsData"
                    :archived="activeDesktopTab === 'archived'"
                    :desktop="true"
                    @refresh="refreshProjects"
                />
            </div>
        </div>

        <UModal color="neutral" variant="subtle" v-model:open="addProjectModalState" class="p-4 w-[60%] divide-y-0">
            <template #content class="flex justify-center">
                <div class="pb-3 justify-center pb-2 w-full text-center">Podaj nazwę nowego projektu:</div>
                <UForm :validate="validate" :state="state" @submit.prevent="addProject">
                    <div class="text-center">
                        <UFormField name="projectName" class="pb-3">
                            <UInput v-model="state.projectName"></UInput>
                        </UFormField>
                    </div>
                    <div class="flex justify-center">
                        <UButton type="submit" class="w-15 ml-0 mp-3 justify-center" color="success" loading-auto :disabled="isFormValid()">Utwórz</UButton>
                    </div>
                </UForm>
            </template>
        </UModal>
        <UFooter>

        </UFooter>
    </UApp>
</template>
