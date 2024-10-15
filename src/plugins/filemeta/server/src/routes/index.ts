export default [
  {
    method: 'GET',
    path: '/filemeta',
    // name of the controller file & the method.
    handler: 'controller.index',
    config: {
      auth: false,
    },
  },
];
