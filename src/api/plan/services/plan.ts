/**
 * plan service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::plan.plan', ({ strapi }) => ({
    async find(params) {
        // Calling the default core controller
        const { results, pagination } = await super.find(params);
        const documentIds = results.map((row) => row.documentId);
        const termRelationships = await strapi.documents('api::term-relationship.term-relationship').findMany({
            filters: {
                objectId: documentIds,
            },
            populate: {
                taxonomy: {
                    populate: ['term']
                }
            },
        });
        const output = await Promise.all(results.map(async (row) => {
            const { documentId } = row;
            const termRelationship = termRelationships.find((termRelationship) => termRelationship.objectId === documentId);
            const subscribedCount = await strapi.documents('api::subscription.subscription').count({ filters: {
                objectId: documentId,
                objectType: 'plan'
            }})
            return {
                ...row,
                type: termRelationship?.taxonomy?.term?.label || '',
                subscribedCount,
                triggerCount: 0,
                executionCount: 0,
            };
        }))
        return {
            results: output, pagination
        };
    },
    async findOne(...args) {
        const document = await super.findOne(...args);
        const { documentId } = document;
        const termRelationships = await strapi.documents('api::term-relationship.term-relationship').findMany({
            filters: {
                objectId: documentId,
            },
            populate: {
                taxonomy: {
                    populate: ['term']
                }
            },
        });
        const termRelationship = termRelationships.find((termRelationship) => termRelationship.objectId === documentId);
        return {
            ...document,
            type: termRelationship?.taxonomy?.term?.label || '',
            trigger_count: 0,
            execution_count: 0,
        };
    },
    async create(params) {
        const result = await super.create(params);
        return result;
    },
    async update(documentId, params) {
        const result = await super.update(documentId, params);
        return result;
    }
}));
