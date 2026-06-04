<script setup>
navigateTo('/login')
</script>
<template>
    <UApp>
        <div
            class="content-center text-center align-middle min-h-screen justify-center"
        >
            <span>Piece wędzarnicze</span>
            <nuxt-link to="/about" class="text-red-500 hover:text-blue-500"
                >About</nuxt-link
            >
            <nuxt-link to="/login">Zaloguj się</nuxt-link>
        </div>
    </UApp>
</template>
