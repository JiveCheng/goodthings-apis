export default {
    routes: [
        {
            method: 'GET',
            path: '/plans/activities',
            handler: 'api::plan.plan.getActivities', // or 'plugin::plugin-name.controllerName.functionName' for a plugin-specific controller
            config: {
                auth: false,
            },
        },
        {
            method: 'GET',
            path: '/plans/random',
            handler: 'api::plan.plan.random', // or 'plugin::plugin-name.controllerName.functionName' for a plugin-specific controller
            config: {
                auth: false,
            },
        },
    ],
};