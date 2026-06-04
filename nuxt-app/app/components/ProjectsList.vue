<script setup>
import { ref, computed, watch } from 'vue'
const props = defineProps(['projects', 'archived', 'desktop'])
const devIP = import.meta.env.VITE_DEV_IP

const { data, error } = useFetch('http://' + devIP + ':3003/api/me', {
    method: 'GET',
    server: false,
    credentials: 'include'
});
const formattedProjects = computed(() => {
    if(!props.projects) return
    return props.projects
        .filter(e => {
            if (props.archived === true) {
                return e.archived === 2
            }
            else return e.archived === 1
        })
        .map((e, index) => ({
            id: index + 1,
            title: e.name,
            description: e.description || 'No description.',
            to: 'project/' + e.id,
            projectID: e.id
        }))
})

watch(error, (newError) => {
    console.log(newError)
})

function archiveProject(projectID, action) {
    const { data, error } = useFetch('http://' + devIP + ':3003/api/project/archive', {
        method: 'POST',
        server: false,
        credentials: 'include',
        body: {
            projectID: projectID,
            archived: action ? 1 : 2
        }
    })
}


const dropdownItems = (item) => {
    return props.archived
        ? [
            {
                label: 'Przywróć',
                icon: 'lucide:archive-restore',
                color: 'success',
                onSelect() {
                    console.log('Przywróć projekt: ', item.projectID)
                }
            },
            {
                label: 'Usuń',
                icon: 'lucide:trash-2',
                color: 'error',
                onSelect() {
                    console.log('Usuń projekt: ', item.projectID)
                }

            }
        ]
        :[
            {
                label: 'Archiwizuj',
                icon: 'lucide:archive',
                onSelect() {
                    console.log('Zarchiwizuj' +
                        ' projekt: ', item.projectID)
                }
            },
            {
                label: 'Usuń',
                icon: 'lucide:trash-2',
                color: 'error',
                onSelect() {
                    console.log('Usuń projekt: ', item.projectID)
                }
            }
        ]
}


const lanes = ref(3)
const gap = ref(16)
const estimateSize = () => 120

</script>

<template>
    <div v-if="!props.desktop">

        <UScrollArea  class="h-max w-full" :ui="{ viewport: 'gap-4 p-4' }"
                      v-slot="{ item, index }"
                      :items="formattedProjects"
                      :orientation="orientation"
        >
            <UPageCard
                v-bind="item"
                variant="soft"
                class="rounded-2xl min-h-30"
            >
                <UDropdownMenu :items="dropdownItems(item)" class="flex absolute right-4 sm:r-6">
                    <UButton icon="lucide:more-vertical" color="neutral" variant="ghost" class="w-fit ml-auto z-10 hover:bg-[#FFFFFF1F]"/>
                </UDropdownMenu>
            </UPageCard>
        </UScrollArea>
    </div>

    <div v-else>
    <UScrollArea  class="h-max w-full p-3 pl-30 pr-30" :ui="{ viewport: 'gap-4 p-4' }"
        v-slot="{ item, index }"
        :items="formattedProjects"
        :orientation="orientation"
        :virtualize="{
            gap,
            lanes,
            estimateSize
        }"
    >
        <UPageCard
            v-bind="item"
            variant="soft"
            class="rounded-2xl min-h-30"

        />
    </UScrollArea>
    </div>
</template>