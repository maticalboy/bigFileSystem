import axios from "../http"

const file = {
    /**
     * @description: 单文件上传
     * @return {*}
     */
    singleUpload: function (fileData) {
        return new Promise((resolve, reject) => {
            axios.post('/singleFileUpload', fileData, {
                onUploadProgress: (progressEvent) => {
                    const uploadedPercent = Math.round(
                        (progressEvent.loaded / progressEvent.total) * 100
                    );
                    resolve(uploadedPercent); // 将上传进度信息通过Promise返回
                },
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }).then(response => {
                resolve(response.data); // 上传完成后，将响应数据通过Promise返回
            }).catch(error => {
                reject(error); // 如果上传过程中出现错误，通过Promise返回错误信息
            });
        });
    }
}
export default file