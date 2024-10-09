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
}));
