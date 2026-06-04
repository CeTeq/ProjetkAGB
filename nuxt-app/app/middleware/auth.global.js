const devIP = import.meta.env.VITE_DEV_IP

export default defineNuxtRouteMiddleware(async (to, from) => {
    if (to.path === '/login') return

    try {
        await $fetch('http://' + devIP + ':3003/api/me', {
            method: 'GET',
            credentials: 'include',
            headers: {
                ...useRequestHeaders(['cookie'])
            }
        });
        // return console.log(from)
    } catch (error) {
        console.error('Auth check failed:', error);
        return navigateTo('/login')
    }
})
