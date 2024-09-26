module.exports = ({ env }) => ({
    upload: {
        config: {
            provider: 'aws-s3',
            providerOptions: {
                baseUrl: env('CDN_URL', `https://${env('AWS_BUCKET')}.s3.${env('AWS_REGION')}.amazonaws.com`),
                rootPath: env('CDN_ROOT_PATH', 'develop'),
                s3Options: {
                    credentials: {
                        accessKeyId: env('AWS_ACCESS_KEY_ID'),
                        secretAccessKey: env('AWS_ACCESS_SECRET'),
                    },
                    region: env('AWS_REGION'),
                    params: {
                        ACL: env('AWS_ACL', 'public-read'),
                        signedUrlExpires: env('AWS_SIGNED_URL_EXPIRES', 15 * 60),
                        Bucket: env('AWS_BUCKET'),
                    },
                },
            },
            actionOptions: {
                upload: {},
                uploadStream: {},
                delete: {},
            },
        },
    },
});
