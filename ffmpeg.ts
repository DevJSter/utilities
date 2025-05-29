const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

const compressVideo = (input: string, output: string, crf: number = 28) => {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        `-crf ${crf}`,
        '-preset medium',
        '-movflags +faststart'
      ])
      .on('progress', (progress : any) => {
        console.log(`Progress: ${progress.percent?.toFixed(2)}%`);
      })
      .on('end', () => {
        console.log('✅ Compression finished.');
        resolve(output);
      })
      .on('error', (err :string) => {
        reject(err);
      })
      .save(output);
  });
};

const inputVideo = path.join(__dirname, 'input.mp4');
const outputVideo = path.join(__dirname, 'output_compressed.mp4');

compressVideo(inputVideo, outputVideo)
  .then(() => console.log('All done.'))
  .catch(console.error);
