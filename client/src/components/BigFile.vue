<template>
    <div>
        <!-- 多文件上传 -->
        <div>
            <input
                type="file"
                ref="uploadFileRef"
                @change="localUpload"
                multiple
            />
            <button @click="handleInputFileConfirm">上传</button>
        </div>
        <!-- 待上传区 -->
        <div>
            <el-table :data="fileList" style="width: 100%">
                <el-table-column
                    align="center"
                    prop="name"
                    label="名称"
                    width="180"
                >
                </el-table-column>
                <el-table-column
                    align="center"
                    prop="size"
                    label="大小"
                    width="180"
                >
                </el-table-column>
                <el-table-column align="center" label="上传进度">
                    <template slot-scope="scope">
                        <i class="el-icon-time"></i>
                        <span style="margin-left: 10px">{{
                            (scope.row.process || 0) + "%"
                        }}</span>
                    </template>
                </el-table-column>
                <el-table-column align="center" label="操作" width="500">
                    <template slot-scope="scope">
                        <el-button
                            size="mini"
                            @click="handleEdit(scope.$index, scope.row)"
                            >编辑</el-button
                        >
                        <el-button
                            size="mini"
                            type="danger"
                            @click="handleDelete(scope.$index, scope.row)"
                            >删除</el-button
                        >
                    </template>
                </el-table-column>
            </el-table>
        </div>
    </div>
</template>
<script>
import axios from "@/request/http";
import SparkMD5 from "spark-md5";
import axios1 from 'axios'
const CancelToken = axios1.CancelToken;
export default {
    name: "BigFile",
    data() {
        return {
            // 待上传区
            fileList: [],
        };
    },
    methods: {
        /**
         * 获取文件的MD5数值
         * @param {*} file
         */
        getUploadFileMD5(file) {
            return new Promise((resolve, reject) => {
                const fileReader = new FileReader();

                fileReader.onload = () => {
                    const arrayBuffer = fileReader.result;
                    const md5Hash = SparkMD5.ArrayBuffer.hash(arrayBuffer);
                    resolve(md5Hash);
                };

                fileReader.onerror = (error) => {
                    reject(error);
                };

                fileReader.readAsArrayBuffer(file);
            });
        },

        /**
         * @description: 本地文件上传到浏览器
         * @return {*}
         */
        localUpload(e) {
            const files = e.target.files;
            let arr = [...this.fileList, ...files];
            // 文件上传到 待上传区
            this.fileList = arr.map((item) => {
                return {
                    name: item.name,
                    size: item.size,
                    file: item,
                    process: item.process || 0,
                    status: item.status || "ready",
                };
            });
        },
        handleEdit(index, row) {
            console.log(index, row);
        },
        handleDelete(index, row) {
            console.log(index, row);
        },
        /**
         * @description: 上传的逻辑
         * @return {*}
         */
        handleInputFileConfirm() {
            const fileList = this.fileList;
            // 没选择文件则不调用接口
            if (!fileList.length) return;

            // 根据当前文件大小，判断是分片上传还是 直接上传
            for (let index = 0; index < fileList.length; index++) {
                let item = fileList[index];
                if (item.size <= 1024 * 1024 * 2 && item.status != "success") {
                    // 直接上传
                    this.singleUploadFile(
                        item.name,
                        item.file,
                        index,
                        item.cancelHttp
                    );
                } else if (
                    item.size > 1024 * 1024 * 2 &&
                    item.status != "success"
                ) {
                    // 分片上传
                    this.sliceUploadFile(
                        item.name,
                        item.file,
                        index,
                        item.cancelHttp
                    );
                }
            }
        },
        /**
         * @description: 单文件上传
         * @param {*} fileName 文件名
         * @param {*} file 文件
         * @return
         * @return {*}
         */
        singleUploadFile(fileName, file, index, cancelHttp) {
            const fileData = new FormData();
            fileData.append("file", file);
            fileData.append("title", fileName);
            // 调用接口上传文件
            axios
                .post("/singleFileUpload", fileData, {
                    onUploadProgress: (progressEvent) => {
                        const uploadedPercent = Math.round(
                            (progressEvent.loaded / progressEvent.total) * 100
                        );
                        // 更新fileList数组中对象的属性并触发视图更新
                        this.fileList[index].process = uploadedPercent;
                        this.$set(
                            this.fileList,
                            index,
                            Object.assign({}, this.fileList[index])
                        );
                    },
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                })
                .then((res) => {
                    // 创建一个新的file对象
                    this.fileList[index].status = "success";
                    this.$set(
                        this.fileList,
                        index,
                        Object.assign({}, this.fileList[index])
                    );
                });
        },
        async sliceUploadFile(
            fileName,
            file,
            index,
            cancelHttp,
            chunkSize = 2 * 1024 * 1024,
        ) {
            const md5 = await this.getUploadFileMD5(file);
            const size = file.size;
            const chunkList = [];
            const chunkListLength = Math.ceil(size / chunkSize);
            const suffix = /\.([0-9A-z]+)$/.exec(fileName)[1];
            let index1 = 0;

            // 将文件切片成多个chunk
            while (index1 < chunkListLength) {
                chunkList.push({
                    chunk: index1,
                    chunks: chunkListLength,
                    md5: md5,
                    file: file.slice(
                        index1 * chunkSize,
                        (index1 + 1) * chunkSize
                    ),
                    fileName: `${md5}_${index1 + 1}.${suffix}`,
                });
                index1++;
            }

            let count = 0;
            for (let i = 0; i < chunkListLength; i++) {
                let item = chunkList[i];
                // 如果该chunk已经在已上传的部分文件列表中，则跳过该chunk继续上传下一个
                const fileData = new FormData();
                fileData.append("md5", item.md5);
                fileData.append("file", item.file);
                fileData.append("name", item.fileName);
                fileData.append("chunk", item.chunk);
                fileData.append("chunks", item.chunks);
                let obj = this.fileList[index]
                // 调用接口上传文件
                await axios.post("/uploadChunk", fileData, {
                    onUploadProgress: (progressEvent) => {
                        const uploadedPercent = Math.floor(
                            ((i * chunkSize + progressEvent.loaded) / size) *
                                100
                        );
                        // 更新fileList数组中对象的属性并触发视图更新
                        this.fileList[index].process = uploadedPercent;
                        this.$set(
                            this.fileList,
                            index,
                            Object.assign({}, this.fileList[index])
                        );
                    },
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });

                count++;
            }
            if (count === chunkListLength) {
                // 完成所有chunk的上传后，发送请求进行文件合并
                await axios.post(
                    "/uploadMerge",
                    {
                        hash: md5,
                        name: fileName,
                    },
                );
                // 创建一个新的file对象
                this.fileList[index].status = "success";
                this.$set(
                    this.fileList,
                    index,
                    Object.assign({}, this.fileList[index])
                );
                return;
            }
        },
    },
};
</script>
