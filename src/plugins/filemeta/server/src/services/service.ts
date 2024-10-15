import type { Core } from '@strapi/strapi';

const service = ({ strapi }: { strapi: Core.Strapi }) => ({
    getWelcomeMessage() {
        console.log('getWelcomeMessage');
        return 'Welcome to Strapi 🚀';
    },
    async setFileOwner(fileId, data) {
        // 先取得原本的 filemeta 欄位的資料
        const file = await strapi.db.query("plugin::upload.file").findOne({ where: { id: fileId } });
        // 如果找不到 fileID 就不做事
        if (!file) return;
        const oldFileMeta = !!file.filemeta ? file.filemeta : {};
        const newFileMeta = {
            ...oldFileMeta,
            ...data
        }
        const res = await strapi.db.query("plugin::upload.file").update({
            where: { id: fileId }, data: {
                "filemeta": newFileMeta
            }
        });

        return res;
    }
});

export default service;
