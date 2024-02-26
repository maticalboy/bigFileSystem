const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
    transpileDependencies: true,
    lintOnSave: false,
    devServer: {
        proxy: {
            '/egg': {
                target: 'http://127.0.0.1:3000',
                changeOrigin: true,
                pathRewrite: {
                    '^/egg': ''
                },
                onProxyRes(proxyRes, req, res) {
                    const realUrl = new URL(req.url, 'http://127.0.0.1:3000')?.href || ''; // 真实请求网址
                    console.log(realUrl); // 在终端显示
                    proxyRes.headers['A-Real-Url'] = realUrl; // 添加响应标头(A-Real-Url为自定义命名)，在浏览器中显示
                },
            },
        }

    }
})
