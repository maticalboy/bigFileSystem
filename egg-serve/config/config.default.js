/* eslint valid-jsdoc: "off" */

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
    /**
     * built-in config
     * @type {Egg.EggAppConfig}
     **/
    const config = exports = {

    };

    // use for cookie sign key, should change to your own and keep security
    config.keys = appInfo.name + '_1708306822153_2380';

    // add your middleware config here
    config.middleware = [];

    // 关闭CSRF 验证
    config.security = {
        csrf: {
            enable: false
        }
    }

    // 启用文件
    config.multipart = {
        mode: 'file',
        fileExtensions: ['.docx', '.pdf', '', '.exe']
    };

    // add your user config here
    const userConfig = {
        // myAppName: 'egg',
        cluster: {
            listen: {
                path: '',
                port: 3000,// 这里就是你要修改的端口号
                hostname: '127.0.0.1', // 0.0.0.0
            }
        }
    };

    return {
        ...config,
        ...userConfig,
    };
};
