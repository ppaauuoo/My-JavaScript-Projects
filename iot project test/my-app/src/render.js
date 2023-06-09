const videoElement = document.querySelector('video');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const videoSelectBtn = document.getElementById('videoSelectBtn');
videoSelectBtn.onclick = getVideoSources;
startBtn.onclick = e => {
    mediaRecorder.start();
    startBtn.classList.add('is-danger');
    startBtn.innerText = 'Recording';
  };
  stopBtn.onclick = e => {
    mediaRecorder.stop();
    startBtn.classList.remove('is-danger');
    startBtn.innerText = 'Start';
  };

// renderer changes in electron17
const { ipcRenderer } = require('electron')

const desktopCapturer = {
  getSources: (opts) => ipcRenderer.invoke('DESKTOP_CAPTURER_GET_SOURCES', opts)
}
// remote change in electron 14
const remote = require('@electron/remote');
const { dialog, Menu } = remote;
//
async function getVideoSources(){
    const inputSource = await desktopCapturer.getSources({
        types: ['window','screen']
    });

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSource.map(source =>{
            return{
                label: source.name,
                click: () => selectSource(source)
            };
        })
    );

    console.log(inputSource);
    videoOptionsMenu.popup();
}

let mediaRecorder;
const recordedChunks = [];

async function selectSource(source){
    videoSelectBtn.innerText - source.name;

    const constraints ={
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id
            }
        }
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = stream;
    videoElement.play();

    const options = { mimeType: 'video/webm; codecs=vp9' };
    mediaRecorder = new MediaRecorder(stream, options);

    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;
}

function handleDataAvailable(e){
    console.log('video data available');
    recordedChunks.push(e.data);
}

const { writeFile } = require('fs');

async function handleStop(e){
    const blob = new Blob(recordedChunks, {
        type: 'video/webm; codecs=vp9'
    });
    
    const buffer = Buffer.from(await blob.arrayBuffer());

    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: 'Save video',
        defaultPath: `vid-${Date.now()}.webm`
    });

    console.log(filePath);

    writeFile(filePath, buffer, () => console.log('video saved succesfully'));
}
