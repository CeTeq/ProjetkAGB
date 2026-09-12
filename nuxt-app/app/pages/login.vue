<script setup lang="js">
import { reactive } from "vue";
import { navigateTo } from "#app";

const toast = useToast();
const devIP = import.meta.env.VITE_DEV_IP;
async function onSubmit(event) {
    console.log(event.data.user);

    try {
        await $fetch("http://" + devIP + ":3003/api/login", {
            method: "POST",
            body: {
                user: event.data.user,
                pass: event.data.pass,
            },
            credentials: "include",
        });
        await navigateTo("/user");
    } catch (error) {
        console.error("Login failed:", error);
        toast.add({
            title: "Error",
            description: "Login failed",
            color: "danger",
        });
    }
}

const state = reactive({
    user: undefined,
    pass: undefined,
});

function validate(state) {
    const errors = [];
    if (!state.user) errors.push({ name: "user", message: "Required" });
    if (!state.pass) errors.push({ name: "pass", message: "Required" });
    return errors;
}
</script>
<template>
    <UApp>
        <div class="w-screen h-screen flex place-items-center justify-center">
            <UForm
                :validate="validate"
                :state="state"
                class="space-y-4"
                @submit.prevent="onSubmit"
            >
                <UFormField label="Login" name="user">
                    <UInput v-model="state.user" />
                </UFormField>

                <UFormField label="Password" name="pass">
                    <UInput v-model="state.pass" type="password" />
                </UFormField>

                <UButton
                    type="submit"
                    class="w-full justify-center"
                    loading-auto
                >
                    Login
                </UButton>
            </UForm>
        </div>
    </UApp>
</template>
