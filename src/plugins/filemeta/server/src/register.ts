import type { Core } from '@strapi/strapi';
import { yup, validateYupSchema } from "@strapi/utils";
const utils = require("@strapi/utils");

const { ValidationError } = utils.errors;
const fileInfoSchema = yup.object({
    name: yup.string().nullable(),
    alternativeText: yup.string().nullable(),
    caption: yup.string().nullable(),
    owner: yup.object({
        user: yup.number().nullable(),
        group: yup.number().nullable()
    })
}).noUnknown();
const uploadSchema = yup.object({
    fileInfo: fileInfoSchema
});
const multiUploadSchema = yup.object({
    fileInfo: yup.array().of(fileInfoSchema)
});
const validateUploadBody = (data = {}, isMulti = false) => {
    const schema = isMulti ? multiUploadSchema : uploadSchema;
    return validateYupSchema(schema, { strict: false })(data);
};
const register = ({ strapi }: { strapi: Core.Strapi }) => {
    // register phase
    const pluginUpload = strapi.plugin('upload');
    const pluginFileMeta = strapi.plugin("filemeta")
    const uploadService = strapi.plugin("upload").service("upload");
    const uploadControllers = pluginUpload.controllers;
    const uploadContentApi = uploadControllers['content-api'];
    const sanitizeOutput = async (data, ctx) => {
        const schema = strapi.getModel('plugin::upload.file');
        const { auth } = ctx.state;
        return strapi.contentAPI.sanitize.output(data, schema, { auth });
    };

    strapi.plugin('upload').contentTypes.file.attributes.filemeta = {
        type: 'json',
        config: {
            required: false,
        },
    }

    uploadContentApi.updateFileInfo = async (ctx) => {
        const {
            query: { id },
            request: { body }
        } = ctx;
        const data = await validateUploadBody(body);
        if (!id || typeof id !== "string" && typeof id !== "number") {
            throw new ValidationError("File id is required and must be a single value");
        }
        const owner = !!body.owner ? JSON.parse(body.owner) : null;
        const hasOwner = !!owner && (!!owner.user || !!owner.group);
        if (hasOwner) {
            const { user, group } = owner;
            const setFileOwner = pluginFileMeta.service("service").setFileOwner;
            let fileMetaData = { owner: {} };
            if (user) {
                fileMetaData.owner = { user };
            }
            if (group) {
                fileMetaData.owner = { group };
            }
            await setFileOwner(id, fileMetaData);
        }
        const result = await uploadService.updateFileInfo(id, data.fileInfo);
        ctx.body = await sanitizeOutput(result, ctx);
    }
};

export default register;
