const { Controller } = require('egg');
const fs = require('fs');
const path = require('path'); // 补上缺失的 path 模块
class UploadController extends Controller {
    beforeAcceptFile() {
        // 2 获取当前的存储文件夹
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1; // 月份是从 0 开始计数的，需要加 1
        const day = currentDate.getDate();

        // 3 判断当前的存储文件夹是否存在
        const UPLOAD_DIR = path.join(__dirname, "../public");
        !fs.existsSync(UPLOAD_DIR) ? fs.mkdirSync(UPLOAD_DIR) : null;
        const currentDayDir = path.join(UPLOAD_DIR, `./${year}${month < 10 ? '0' + month : month}${day < 10 ? '0' + day : day}`)
        !fs.existsSync(currentDayDir) ? fs.mkdirSync(currentDayDir) : null;
        return { UPLOAD_DIR, currentDayDir }

    }
    async singleFileUpload() {
        const { ctx } = this;
        try {
            // 2 获取当前的存储文件夹
            const { UPLOAD_DIR, currentDayDir } = this.beforeAcceptFile()
            
            const file = ctx.request.files[0];
            //读取文件
            const fileData = fs.readFileSync(file.filepath);
            const date = Date.now(); // 毫秒数
            //设置文件保存路径
            const tempDir = path.join(
                currentDayDir,
                date + path.extname(file.filename)
            );
            // 写入文件夹
            fs.writeFileSync(tempDir, fileData)
            ctx.body = {
                status: 200,
                desc: '上传成功',
                data: tempDir,
            };
        } catch (err) {
            console.log(err)
            ctx.body = {
                status: 500,
                desc: '上传失败',
                data: err,
            };
        }
    }
    async multipleFileUpload() {
        const { ctx } = this;
        console.log(`共收到 ${ctx.request.files.length} 个文件`);
        let successFiles = [];
        let failedFiles = [];
        for (const file of ctx.request.files) {
            let result;
            try {
                //读取文件
                const fileData = fs.readFileSync(file.filepath);
                const date = Date.now(); // 毫秒数
                //设置文件保存路径
                const tempDir = path.join(
                    'app/public',
                    date + path.extname(file.filename)
                );
                // 写入文件夹
                fs.writeFileSync(tempDir, fileData)
                successFiles.push(tempDir); // 记录成功写入的文件路径
            } catch (err) {
                console.log(err)
                failedFiles.push(file.filename); // 记录写入失败的文件名
            }
        }
        if (failedFiles.length === 0) {
            ctx.body = { success: true, message: '所有文件写入成功', successFiles };
        } else {
            ctx.body = { success: false, message: '部分文件写入失败', failedFiles, successFiles };
        }
    }
    async uploadChunk() {
        const { ctx } = this;

        // 1 获取上传的文件
        const file = ctx.request.files[0];

        // 2 获取当前的存储文件夹
        const { UPLOAD_DIR, currentDayDir } = this.beforeAcceptFile()

        // 5 分片文件对应的文件夹
        const chunkDir = `${currentDayDir}/${ctx.request.body.md5}`;

        // 6 判断文件夹是否存在 不存在则新建一个
        !fs.existsSync(chunkDir) ? fs.mkdirSync(chunkDir) : null;

        // 7 分片的路径
        const dPath = path.join(chunkDir, ctx.request.body.md5 + '_' + ctx.request.body.chunk);
        if (!fs.existsSync(dPath)) {
            const fileData = fs.readFileSync(file.filepath);
            fs.writeFileSync(dPath, fileData)
        }
        
        ctx.body = {
            sliceKey: ctx.request.body.md5 + '_' + ctx.request.body.chunk,
            msg: "单片上传成功",
        };

    }
    async mergeFileChunk() {
        const { ctx } = this;
        const { UPLOAD_DIR, currentDayDir } = this.beforeAcceptFile()
        const chunkDir = `${currentDayDir}/${ctx.request.body.hash}`;
        const fileNameArr = ctx.request.body.name.split(".");
        const filePath = `${currentDayDir}/${fileNameArr[0]}.${fileNameArr[1]}`
        let suffix = fileNameArr[1];
        const chunksName = await fs.readdirSync(chunkDir);
        //进行排序
        chunksName.sort((a, b) => {
            let reg = /_(\d+)/;
            return reg.exec(a)[1] - reg.exec(b)[1];
        });
        chunksName.forEach((item) => {
            !suffix ? (suffix = /\.([0-9a-zA-Z]+)$/.exec(item)[1]) : null;
            fs.appendFileSync(
                filePath,
                fs.readFileSync(`${chunkDir}/${item}`)
            );
            fs.unlinkSync(`${chunkDir}/${item}`);
        });
        try {
            fs.rmdirSync(chunkDir);
            ctx.body = {
                path: filePath,
                msg: "单片合并成功",
            };
        } catch (err) {
            console.log(err);
        }
    }
}

module.exports = UploadController;
