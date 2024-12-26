/**
 * wish service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::wish.wish', ({ strapi }) => ({
    async find(...args) {
        // Calling the default core controller
        const { results, pagination } = await super.find(...args);

        const documentIds = results.map((row) => row.documentId);
        const comments = await strapi.documents('api::comment.comment').findMany({
            filters: {
                objectId: documentIds,
                objectType: 'wish',
            }
        });

        const output = await Promise.all(results.map(async (row) => {
            const { documentId } = row;
            const commentsIncludeCheerUp = comments.filter((comment) => comment.objectId === documentId);
            const commentsOfDoc = commentsIncludeCheerUp.filter(comment => {
                const strContent = JSON.stringify(comment.content);
                return strContent !== '[1]' && strContent !== '["1"]' && strContent !== '[0]' && strContent !== '["0"]';
            })
            const commentsCount = commentsOfDoc.length || 0;
            const cheerUps = commentsIncludeCheerUp.filter(comment => {
                const strContent = JSON.stringify(comment.content)
                return strContent === '[1]' || strContent === '["1"]';
            })
            const cheerUpCount = cheerUps.length || 0;
            return {
                ...row,
                commentsCount, cheerUpCount
            };
        }))

        return { results: output, pagination };
    },
    async findOne(...args) {
        const document = await super.findOne(...args);
        const { documentId } = document;
        
        const commentsIncludeCheerUp = await strapi.documents('api::comment.comment').findMany({
            filters: {
                objectId: documentId,
                objectType: 'wish',
            },
            sort: {
                createdAt: 'desc',
            }
        });

        const comments = commentsIncludeCheerUp.filter(comment => {
            const strContent = JSON.stringify(comment.content);
            return strContent !== '[1]' && strContent !== '["1"]' && strContent !== '[0]' && strContent !== '["0"]';
        })
        const commentsCount = comments.length || 0;
        const cheerUps = commentsIncludeCheerUp.filter(comment => {
            const strContent = JSON.stringify(comment.content)
            return strContent === '[1]' || strContent === '["1"]';
        })
        const cheerUpCount = cheerUps.length || 0;

        return { ...document, commentsCount, cheerUpCount, comments};
    },
}));
