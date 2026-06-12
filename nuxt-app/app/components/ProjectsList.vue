<script setup>
import { ref, computed, watch } from 'vue'
const props = defineProps(['projects', 'archived', 'desktop'])
const emit = defineEmits(['refresh'])
const devIP = import.meta.env.VITE_DEV_IP
const toast = useToast();
const { data, error } = useFetch('http://' + devIP + ':3003/api/me', {
    method: 'GET',
    server: false,
    credentials: 'include'
});



const formattedProjects = computed(() => {
    if (!props.projects) return []
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

async function archiveProject(projectID, action) {
    try {
        await $fetch('http://' + devIP + ':3003/api/project/archive', {
            method: 'POST',
            server: false,
            credentials: 'include',
            body: {
                projectID: projectID,
                archived: action ? 2 : 1
            }
        })

        await emit('refresh')
        console.log('refresh')
        toast.add({
            title: 'Sukces!',
            description: action ? 'Zarchiwizowano projekt.' : 'Przywrócono projekt.',
            color: 'success'
        })
        confirmModalState.value = false
    } catch {

        toast.add({
            title: 'Błąd!',
            description: action ? 'Nie udało się zarchiwizować projektu.' : 'Nie udało się przywrócić projektu.',
            color: 'error'
        })
        confirmModalState.value = false
    }
}
async function deleteProject(projectID) {
    try {
        await $fetch('http://' + devIP + ':3003/api/deleteProject', {
            method: 'POST',
            server: false,
            credentials: 'include',
            body: {
                projectID: projectID
            }
        })
        await new Promise(resolve => setTimeout(resolve, 200))

        toast.add({
            title: 'Sukces!',
            description: 'Usunięto projekt!',
            color: 'success'
        })
        confirmModalState.value = false
        await emit('refresh')
    } catch {
        await new Promise(resolve => setTimeout(resolve, 200))

        toast.add({
            title: 'Błąd!',
            description: 'Nie udało się usunąć projektu.',
            color: 'error'
        })
        confirmModalState.value = false
    }
}
const addProjectModalState = ref(false)
const confirmModalState = ref(false)
let confirmoModalTitle = null
let tempModalProjectID = null

async function confirmModalDelete(title, projectID) {
    confirmModalState.value = true
    confirmoModalTitle = title
    tempModalProjectID = projectID
}
function closeConfirmModal() {
    confirmModalState.value = false
}

const dropdownItems = (item) => {
    return props.archived
        ? [
            {
                label: 'Przywróć',
                icon: 'material-symbols:unarchive-outline',
                color: 'success',
                onSelect() {
                    archiveProject(item.projectID, false)
                }
            },
            {
                label: 'Usuń',
                icon: 'material-symbols:delete-outline',
                color: 'error',
                onSelect() {
                    confirmModalDelete(item.title, item.projectID)
                }

            }
        ]
        :[
            {
                label: 'Archiwizuj',
                icon: 'material-symbols:archive-outline',
                onSelect() {
                    archiveProject(item.projectID, true)
                }
            },
            {
                label: 'Usuń',
                icon: 'material-symbols:delete-outline',
                color: 'error',
                onSelect() {
                    confirmModalDelete(item.title, item.projectID)
                }
            }
        ]
}
const state = reactive({
    projectName: undefined
});
function validate() {
    const errors = []
    if (!state.projectName) errors.push({name: 'projectName', message: 'Required'})
    return errors
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
        <UModal color="neutral" variant="subtle" v-model:open="confirmModalState" class="p-4 w-[80%]">
            <template #content class="flex justify-center">
                <div class="mb-5 justify-center pb-2">Czy na pewno chcesz usunąć projekt o nazwie: "{{confirmoModalTitle}}"</div>
                <div class="flex justify-center">
                    <UButton class="w-15 ml-3 mp-3 justify-center" color="error" @click="deleteProject(tempModalProjectID)" loading-auto :dismissible="false" non-dismissible>Tak</UButton><UButton class="w-15 ml-3 mp-3 justify-center" color="success" @click="closeConfirmModal()">Nie</UButton>
                </div>
            </template>
        </UModal>
        <UModal color="neutral" variant="subtle" v-model:open="addProjectModalState" class="p-4 w-[60%] divide-y-0" @submit.prevent="addProject">
            <template #content class="flex justify-center">
                <div class="pb-3 justify-center w-full text-center">Podaj nazwę nowego projektu:</div>
                <UForm :validate="validate" :state="state">
                    <div class="text-center">
                        <UFormField name="projectName">
                            <UInput v-model="state.projectName" class="pb-3"></UInput>
                        </UFormField>
                    </div>
                    <div class="flex justify-center">
                        <UButton type="submit" class="w-15 ml-3 mp-3 justify-center" color="success" @click="addProject()" loading-auto>Utwórz</UButton>
                    </div>
                </UForm>
            </template>
        </UModal>

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