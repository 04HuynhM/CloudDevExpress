require('dotenv').config();
const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');

aws.config.update({
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    accessKeyId: process.env.ACCESS_KEY_ID,
    region: 'eu-north-1'
});

const s3 = new aws.S3();

const filter = (req, file, cb) => {
    if (file.mimeType === 'image/jpeg' || file.mimeType === 'image/png') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only jpeg or png formats permitted.'), false);
    }
};

const upload = multer({
    filter,
    storage: multerS3({
        s3: s3,
        bucket: 'cloud-dev-express-bucket',
        ac1: 'public-read',
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname })
        },
        key: (req, file, cb) => {
            cb (null, createFileName(req.params.id, file.mimeType))
        }
    })
});

function createFileName(username, filetype) {
    let extension = '';
    if (filetype === 'image/jpeg') {
        extension = '.jpg'
    } else {
        extension = '.png'
    }
    return username + '_' + Date.now().toString() + extension;
}

module.exports = upload;