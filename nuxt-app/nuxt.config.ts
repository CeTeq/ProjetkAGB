// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
export default defineNuxtConfig({
    compatibilityDate: "2025-07-15",
    devtools: { enabled: true },
    modules: ["@nuxt/ui", "nuxt-viewport"],
    components: [
        {
            path: "~/components",
            pathPrefix: false
        }
    ],
    css: ["~/assets/css/main.css"],
    vite: {
        plugins: [tailwindcss()],
    },
    icon: {
        // Force Nuxt to pre-fetch and include these icons globally
        serverBundle: {
            collections: ['lucide']
        }
    }
});
