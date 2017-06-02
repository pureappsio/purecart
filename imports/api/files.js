import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';
import { Random } from 'meteor/random';

import fs from 'fs';
import { FilesCollection } from 'meteor/ostrio:files';

import stream from 'stream';

import S3 from 'aws-sdk/clients/s3';

const s3Conf = Meteor.settings.s3 || {};
const bound = Meteor.bindEnvironment((callback) => {
    return callback();
});

// Create a new S3 object
const s3 = new S3({
    secretAccessKey: s3Conf.secret,
    accessKeyId: s3Conf.key,
    region: s3Conf.region,
    sslEnabled: true,
    httpOptions: {
        timeout: 6000,
        agent: false
    }
});

// if (Meteor.isServer) {

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

// knox = Npm.require('knox');
// Request = Npm.require('request');
// bound = Meteor.bindEnvironment(function(callback) {
//     return callback();
// });
// cfdomain = 'https://' + Meteor.settings.s3.cloudfront; // <-- Change to your Cloud Front Domain
// client = knox.createClient({
//     key: Meteor.settings.s3.key,
//     secret: Meteor.settings.s3.secret,
//     bucket: Meteor.settings.s3.bucket,
//     region: Meteor.settings.s3.region
// });
// }

// Files
const Images = new FilesCollection({
    debug: false, // Change to `true` for debugging
    throttle: false,
    chunkSize: 272144,
    storagePath: 'assets/app/uploads/uploadedFiles',
    collectionName: 'Images',
    allowClientCode: false,
    onAfterUpload(fileRef) {
        var self = this;
        _.each(fileRef.versions, (vRef, version) => {
            const filePath = 'files/' + (Random.id()) + '-' + version + '.' + fileRef.extension;
            s3.putObject({
                ServerSideEncryption: 'AES256',
                StorageClass: 'STANDARD',
                Bucket: s3Conf.bucket,
                Key: filePath,
                Body: fs.createReadStream(vRef.path),
                ContentType: vRef.type,
            }, (error) => {
                bound(() => {
                    if (error) {
                        console.error(error);
                    } else {

                        const upd = { $set: {} };
                        upd['$set']['versions.' + version + '.meta.pipePath'] = filePath;

                        self.collection.update({
                            _id: fileRef._id
                        }, upd, function(updError) {
                            if (updError) {
                                console.error(updError);
                            } else {
                                console.log('Uploaded to S3');
                                self.unlink(self.collection.findOne(fileRef._id), version);
                            }
                        });
                    }
                });
            });
        });
    },
    interceptDownload(http, fileRef, version) {
        let path;

        if (fileRef && fileRef.versions && fileRef.versions[version] && fileRef.versions[version].meta && fileRef.versions[version].meta.pipePath) {
            path = fileRef.versions[version].meta.pipePath;
        }

        if (path) {
            // If file is successfully moved to AWS:S3
            // We will pipe request to AWS:S3
            // So, original link will stay always secure

            // To force ?play and ?download parameters
            // and to keep original file name, content-type,
            // content-disposition, chunked "streaming" and cache-control
            // we're using low-level .serve() method
            const opts = {
                Bucket: s3Conf.bucket,
                Key: path
            };

            if (http.request.headers.range) {
                const vRef = fileRef.versions[version];
                let range = _.clone(http.request.headers.range);
                const array = range.split(/bytes=([0-9]*)-([0-9]*)/);
                const start = parseInt(array[1]);
                let end = parseInt(array[2]);
                if (isNaN(end)) {
                    // Request data from AWS:S3 by small chunks
                    end = (start + this.chunkSize) - 1;
                    if (end >= vRef.size) {
                        end = vRef.size - 1;
                    }
                }
                opts.Range = `bytes=${start}-${end}`;
                http.request.headers.range = `bytes=${start}-${end}`;
            }

            const fileColl = this;
            s3.getObject(opts, function(error) {
                if (error) {
                    console.error(error);
                    if (!http.response.finished) {
                        http.response.end();
                    }
                } else {
                    if (http.request.headers.range && this.httpResponse.headers['content-range']) {
                        // Set proper range header in according to what is returned from AWS:S3
                        http.request.headers.range = this.httpResponse.headers['content-range'].split('/')[0].replace('bytes ', 'bytes=');
                    }

                    const dataStream = new stream.PassThrough();
                    fileColl.serve(http, fileRef, fileRef.versions[version], version, dataStream);
                    dataStream.end(this.data.Body);
                }
            });

            return true;
        }
        // While file is not yet uploaded to AWS:S3
        // It will be served file from FS
        return false;
    }
});

export default Images;
