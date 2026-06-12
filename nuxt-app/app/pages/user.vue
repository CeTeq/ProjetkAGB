<script setup>

import {navigateTo} from "#app";

const nuxtApp = useNuxtApp()
const $viewport = nuxtApp.$viewport
const devIP = import.meta.env.VITE_DEV_IP

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
        navigateTo('/project/' + projectsData.value[projectsData.value.length - 1].id)

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
                                    <UButton type="submit" class="w-15 ml-3 mp-3 justify-center" color="success" loading-auto :disabled="isFormValid()">Utwórz</UButton>
                                </div>
                            </UForm>
                        </template>
                    </UModal>
                    <div class="fixed  left-[85%] top-[92%] z-100">
                        <UButton icon="lucide:plus" class="p-4" @click="addProjectModalState = true">

                        </UButton>
                    </div>
                </template>
                <template #archived="{ item }" class="cursor-pointer">
                    <ProjectsList :projects="projectsData" :archived="true" :desktop="false" @refresh="refreshProjects"></ProjectsList>
                </template>
            </UTabs>
        </div>
        <div v-else>
            <UTabs
                :items="items"
                variant="link"
                class="w-full"
                :ui="{ list: 'justify-start pl-30' }"
            >

            <template #projects="{ item }">
                <ProjectsList :projects="projectsData" :archived="false" :desktop="true" @refresh="refreshProjects"></ProjectsList>
            </template>

            <template #archived="{ item }">
                <ProjectsList :projects="projectsData" :archived="true" :desktop="true" @refresh="refreshProjects"></ProjectsList>
            </template>

            </UTabs>
        </div>
        <UFooter>

        </UFooter>
    </UApp>
</template>
