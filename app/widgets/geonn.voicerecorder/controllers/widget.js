var args = arguments[0] || {};
var timer = require(WPATH("timer"));
var audioRecorder;
var cancel_record = false;
if(OS_ANDROID){
	audioRecorder = require("titutorial.audiorecorder");	
}else{
	console.log(Ti.Media.hasAudioPermissions()+" Ti.Media.hasAudioPermissions()");
	Titanium.Media.setAudioSessionCategory(Ti.Media.AUDIO_SESSION_CATEGORY_PLAY_AND_RECORD);
	audioRecorder = Titanium.Media.createAudioRecorder ({compression : Ti.Media.AUDIO_FORMAT_AAC, format: Titanium.Media.AUDIO_FILEFORMAT_MP4});
}


function startRecording(){
	//$.message_bar.animate({right: 200, duration: 30});
	Titanium.Media.setAudioSessionCategory(Ti.Media.AUDIO_SESSION_CATEGORY_PLAY_AND_RECORD);
	timer.start($.timer);
	$.text_area.width = Ti.UI.SIZE;
	$.timer.show();
	$.timer_text.show();
	if(OS_IOS){
		console.log('here!!!');
		audioRecorder.start();
	}else{
		audioRecorder.startRecording(
			{
				outputFormat : audioRecorder.OutputFormat_MPEG_4,
				audioEncoder : audioRecorder.AudioEncoder_AMR_NB,
				directoryName : "plux",
				fileName : "tempfile",
				success : function(e) {
					//alert("success => " + e.filePath);
					console.log("response is => " + JSON.stringify(e));
					args.loadingStart();
					var audioDir = Titanium.Filesystem.getFile(Titanium.Filesystem.externalStorageDirectory, "plux");
					var audioFile = Ti.Filesystem.getFile(audioDir.resolve(), e.fileName);
					console.log("audioFile.nativePath = " + audioFile.nativePath);
					if(!cancel_record){
						args.record_callback({message: "", format:"voice", filedata: audioFile.read()});
					}
				},
				error : function(d) {
					alert("error => " + d.message);
					console.log("error is => " + JSON.stringify(d));
				}
			}
		);
	}
}

function stopRecording(){
	var sec = timer.stop();
	if(sec <= 1){
		cancel_record = true;	
	}
	if(OS_IOS){
		var audioFile = audioRecorder.stop();
		console.log(audioFile);
		if(sec > 1)
			args.loadingStart();
			args.record_callback({message: "", format:"voice", filedata: audioFile.read()});
	}else{
		audioRecorder.stopRecording();
	}
	//$.message_bar.animate({right: 50, duration: 30});
	$.text_area.width = 0;
	$.timer_text.hide();
	$.timer.hide();
}

// call dispose when done
function init() {
	$.timer.hide();
	$.timer_text.hide();
	$.text_area.width = 0;
	console.log(WPATH('images/icon_mic.png'));
	var img_mic = $.UI.create("ImageView", {image: WPATH('images/icon_mic.png'), top: 10, bottom:10, zIndex:3, right: 10, height: 30, width: 30});
	img_mic.addEventListener("touchstart", startRecording);
	img_mic.addEventListener("touchend", stopRecording);
	$.container.add(img_mic);
};

init();

// EVENTS
exports.addEventListener = $.on;
exports.removeEventListener = $.off;
exports.fireEvent = $.trigger; 