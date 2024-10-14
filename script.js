const { exec } = require('child_process');
const path = require('path')
const fs = require('fs')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const mime = require('mime-types')

const s3Client = new S3Client({
    region: process.env.REGION,
    credentials: {
        accessKeyId: process.env.ACCESSKEYID,
        secretAccessKey: process.env.SECRETACCESSKEYID,
    }
})
const PROJECT_ID = process.env.PROJECT_ID

async function init(){
    console.log("Executing script.js");
    const outDirPath = path.join(__dirname,'output')

    const p = exec(`cd ${outDirPath} && npm install && npm run build`)
 
    p.stdout.on('data', data => {
        console.log(data.toString());
        
    })

    p.stdout.on('error', err=> {
        console.log(err.toString());
        
    })

    p.stdout.on('close', async ()=> {
        console.log('Build Complete');
        const distFolderPath = path.join(__dirname,'output','dist')
        const distFolderContents = fs.readdirSync(distFolderPath, {recursive: true})
        
        for(const filePath of distFolderContents){
            if(fs.lstatSync(filePath).isDirectory()){
                continue;
            }
            console.log('Uploading', filePath);
            
            const command = new PutObjectCommand({
                Bucket: process.env.BUCKET_NAME,
                Key: `__outputs/${PROJECT_ID}${filePath}`,
                Body: fs.createReadStream(filePath),
                ContentType: mime.lookup(filePath),
            })

            await s3Client.send(command)
            console.log('Uploaded', filePath);
            
        }

        console.log('Done');
        
    })
    
    
}  

init()