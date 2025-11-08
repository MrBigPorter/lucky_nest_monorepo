export default defineAppConfig({
    ui: {
        strategy: 'class', // respect .dark

        colors: {
            primary: 'indigo',
            neutral: 'slate',
            success: 'green',
            info: 'sky',
            warning: 'amber',
            error: 'rose'
        },

        button: {
            rounded: 'rounded-md',                  // matches --la-radius-md
            size: 'md'
        },

        card: {
            rounded: 'rounded-2xl',                 // close to --la-radius-lg/xl
            shadow: 'shadow-sm'
        },

        input: {
            rounded: 'rounded-md',
            size: 'md'
        },

        tooltip: {
            background: 'bg-slate-900/95',
            color: 'text-slate-50'
        }
    }
})