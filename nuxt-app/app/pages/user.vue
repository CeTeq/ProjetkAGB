<script setup>
import { useNuxtApp } from "#app";
import ProjectList from "~/components/ProjectsList.vue"

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
        icon: "i-lucide-user",
        slot: "projects",
    },
    {
        label: "Zarchiwizowane",
        icon: "/docs/getting-started",
        slot: "archived",

    },
]);

const { data, error } = useFetch('http://' + devIP + ':3003/api/getProjects', {
    method: 'GET',
    headers: {
        "Content-Type": "applicat   ion/json",
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
                    <ProjectList :projects="data" :archived="false" :desktop="false"></ProjectList>
                </template>
                <template #archived="{ item }" class="cursor-pointer">
                    <ProjectList :projects="data" :archived="true" :desktop="false"></ProjectList>
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
                <ProjectList :projects="data" :archived="false" :desktop="true"></ProjectList>
            </template>

            <template #archived="{ item }">
                <ProjectList :projects="data" :archived="true" :desktop="true"></ProjectList>
            </template>

            </UTabs>
        </div>
    </UApp>
</template>
