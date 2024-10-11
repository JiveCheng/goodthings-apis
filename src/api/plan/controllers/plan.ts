/**
 * plan controller
 */

import { factories } from '@strapi/strapi'
import { filter } from '../../../../config/middlewares';

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
                populate: ['metadata'],
            });

            const { results: comments } = await strapi.service('api::comment.comment').find({
                filters: {
                    objectId: planId,
                },
                populate: ['Log'],
            });

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
            console.log(termRelationships)
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
            console.log(newSlugOfMatchTaxonomies)
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
            console.log(disconnected)
        }
        // some logic here
        const response = await super.update(ctx);
        // some more logic

        return response;
    }
}));
