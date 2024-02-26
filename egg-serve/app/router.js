/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
    const { router, controller } = app;
    router.get('/', controller.home.index);
    router.post('/singleFileUpload', controller.upload.singleFileUpload);
    router.post('/multipleFileUpload', controller.upload.multipleFileUpload);
    // 接收文件上传
    router.post('/uploadChunk', controller.upload.uploadChunk);
    // 合并文件
    router.post('/uploadMerge', controller.upload.mergeFileChunk);
};
