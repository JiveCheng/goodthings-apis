/**
 * plan controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::plan.plan', ({ strapi }) => ({
    async getActivities(ctx) {
        try {
            const query = await this.sanitizeQuery(ctx);
            const { planId } = query as { planId: string };

            const plan = await strapi.documents('api::plan.plan').findOne({
                documentId: planId,
                status: 'published'
            });

            const { results: executions } = await strapi.service('api::execution.execution').find({
                filters: {
                    plan: plan.id,
                },
                populate: ['metadata', 'metadata.items'],
            });

            const comments = [];
            /**
             * 2025-12-26 暫時先註解掉 comment 的部分，等有需要再打開
            const { results: comments } = await strapi.service('api::comment.comment').find({
                filters: {
                    objectId: planId,
                },
                populate: ['Log'],
            });
             */

            const results = [
                ...executions,
                ...comments,
            ].sort((a, b) => {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });

            return {
                data: results, meta: {}
            };
        } catch (err) {
            ctx.body = err;
        }
    },
    /**
     * 這個方法是用來取得有 condition-mets 的 plans，並且隨機取得一個 plan
     * @param ctx 
     */
    async random(ctx) {
        try {
            const query = await this.sanitizeQuery(ctx);
            // 取得 query 的 filters，並將其轉換為 strapi 的 filters 格式
            const filters = query?.filters as { [key: string]: any };
            const pagination = query?.pagination as { [key: string]: any };
            let limit = parseInt(pagination?.pageSize) || 1;
            let offsetStart = parseInt(pagination?.page ? pagination?.page : 0) * limit || 0;

            // 使用 count 來取得有 condition-mets 的 plan 的數量，condition_mets 是一個 plan下的欄位並 Plan belongs to many ConditionsMets
            const count = await strapi.documents('api::plan.plan').count({
                filters: {
                    ...filters
                },
                status: 'published'
            });
            // 使用 count 來取得一個隨機數字
            const random = Math.floor(Math.random() * count);
            if (!pagination?.page && !pagination?.pageSize) {
                offsetStart = random;
            }
            // 使用 random 來取得一個有 condition-mets 的 plan
            const plans = await strapi.documents('api::plan.plan').findMany({
                filters: {
                    ...filters
                },
                status: 'published',
                populate: ['conditions_mets', 'metadata', 'metadata.items'],
                start: offsetStart,
                limit
            });

            return {
                data: plans, meta: {}
            };
        } catch (err) {
            ctx.body = err;
        }
    },
    async create(ctx) {
        const data = ctx.request.body.data
        const { type } = data
        let taxonomyId = null

        if (!!type) {
            const term = await strapi.documents('api::term.term').findMany({
                filters: {
                    slug: type,
                },
                populate: ['taxonomy'],
            });

            if (!term.length) {
                throw new Error('Invalid type');
            }
            taxonomyId = term[0].taxonomy.id
            delete ctx.request.body.data.type
        }

        const response = await super.create(ctx);
        
        // 如果新增 plan 失敗，就不用新增 term relationship
        if (!response) {
            return response;
        }

        console.log(response)

        // 新增 term relationship
        const termRelationships = await strapi.documents('api::term-relationship.term-relationship').create({
            data: {
                objectType: 'plan',
                objectId: response.data.documentId,
                taxonomy: taxonomyId,
            }
        });

        // 如果 term relationship 新增失敗，就刪除剛剛新增的 plan
        if (!termRelationships) {
            await strapi.documents('api::plan.plan').delete({
                documentId: response.documentId
            });
            // 回傳新增失敗的訊息
            return null;
        }

        return response;
    },
    async update(ctx) {
        const data = ctx.request.body.data
        const { type } = data
        

        if (!!type) {
            const extraData = {
                type
            }
            delete ctx.request.body.data.type

            const documentId = ctx.params.id
            const termRelationships = await strapi.documents('api::term-relationship.term-relationship').findMany({
                filters: {
                    objectId: documentId,
                    taxonomy: {
                        name: 'categories'
                    }
                },
                populate: {
                    taxonomy: {
                        populate: ['term']
                    }
                },
            });

            // 如果 taxonomy是categories 的relation 多於一個，代表現在的 taxonomy 不符業務邏輯
            if (termRelationships.length > 1) {
                throw new Error('taxonomy not match')
            }
            const termRelationship = termRelationships[0]
            // 看看 term 中是否有符合 type 的 term
            const { results: newSlugOfMatchTaxonomies } = await strapi.service('api::taxonomy.taxonomy').find({
                filters: {
                    name: 'categories',
                    term: {
                        slug: extraData.type
                    }
                },
                populate: ['term']
            });

            // 如果沒有符合的 term，就報錯
            if (newSlugOfMatchTaxonomies.length === 0) {
                throw new Error('type not found')
            }
            const newSlugOfMatchTaxonomy = newSlugOfMatchTaxonomies[0]
            // 斷開原來 termRelationship 中的 taxonomy 的 relation
            const disconnected = await strapi.documents('api::term-relationship.term-relationship').update({
                documentId: termRelationship.documentId,
                data: {
                    taxonomy: newSlugOfMatchTaxonomy.id
                }
            })
        }
        const response = await super.update(ctx);

        return response;
    }
}));
