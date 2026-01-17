const fs = require('fs');
const path = require('path');
const fse = require('fs-extra'); // npm install fs-extra

// Restore react-native-ffmpeg
const srcFFmpeg = path.join(__dirname, '../archived_ffmpeg/node_modu/react-native-ffmpeg');
const destFFmpeg = path.join(__dirname, '../node_modules/react-native-ffmpeg');
if (fs.existsSync(srcFFmpeg)) {
  fse.copySync(srcFFmpeg, destFFmpeg, {overwrite: true});
  console.log('Restored react-native-ffmpeg from archived_ffmpeg');
}

// Restore Pods (optional, for iOS)
const srcPods = path.join(__dirname, '../archived_ffmpeg/pods/mobile-ffmpeg-https');
const destPods = path.join(__dirname, '../ios/Pods/mobile-ffmpeg-https');
if (fs.existsSync(srcPods)) {
  fse.copySync(srcPods, destPods, {overwrite: true});
  console.log('Restored Pods/mobile-ffmpeg-https from archived_ffmpeg');
}
