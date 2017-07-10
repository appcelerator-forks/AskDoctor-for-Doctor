var args = arguments[0] || {};
var dr_id = args.dr_id || 0;
var loading = Alloy.createController("loading");
var anchor = COMMON.now();
var last_update = COMMON.now();
var start = 0;

var room_set = false;
var refreshIntervalId;
var retry = 0;
var dr_id = Ti.App.Properties.getString('dr_id') || 0;
var last_id = 0;
var last_uid;
var status_text = ["", "Sending", "Sent", "Read"];
var data;
var room_id = args.room_id;
console.log('check here!');
console.log(args);
/**
 * Send message
 */
var sending = false;
function SendMessage(){
	var model = Alloy.createCollection("conversations");
	if($.message.value == "" || sending){
		return;
	}
	loading.start();
	sending = true;
	$.message.editable = false;
	console.log(Ti.App.Properties.getString('name'));
	var app_id = Math.random().toString(36).substr(2, 10);
	var local_save = [{
		"dr_id": dr_id,
		"id": app_id,
	    "sender_id": dr_id,
	    "message": $.message.value,
	    "created": COMMON.now(),
	    "is_endUser": 0,
	    "dr_id": dr_id,
	    "format": "text",
	    "status": 1,
	    "u_id": args.u_id,
	    "sender_name": Ti.App.Properties.getString('name'),
	}];
	var id = model.saveArray(local_save);
	console.log({dr_id: dr_id, message: $.message.value, is_doctor:1, is_endUser:0, u_id: args.u_id, sender_name: Ti.App.Properties.getString('name'), format: "text", sender_id: dr_id, app_id: app_id });
	API.callByPost({url: "sendMessage", params:{dr_id: dr_id, message: $.message.value, is_doctor:1, is_endUser:0, u_id: args.u_id, sender_name: Ti.App.Properties.getString('name'), format: "text", sender_id: dr_id, app_id: app_id }}, {onload: function(responseText){
		
		var res = JSON.parse(responseText);
		console.log(res);
		$.message.value = "";
		$.message.editable = true;
		sending = false;
		$.message.blur();
		loading.finish();
		console.log("yes!loading finish");
		socket.fireEvent("socket:sendMessage", {room_id: room_id});
		//Ti.App.fireEvent("web:sendMessage", {room_id: room_id});
		
	}});
	
	//var params = {dr_id: dr_id, to_id: to_id, message: $.message.value, type: "text", room_id: room_id};
	//var messager = Alloy.createCollection('message');
	
	//messager.saveRecord(params);
	
}

function navToWebview(e){
	var url = parent({name:"url"}, e.source);
	console.log(url);
	var win = Alloy.createController("webview", {url: url}).getView();
	win.open();
}

function render_conversation(latest){
	if(!latest){
		//$.chatroom.setContentOffset({y: 100});
	}
	var contain_height = 50;
	
	if(latest){
		data.reverse();
	}
	console.log("data here!");
	console.log(data);
	for (var i=0; i < data.length; i++) {
		var view_container = $.UI.create("View",{
			classes: ['hsize','wfill'],
			m_id: data[i].id
		});
		
		//console.log("message:"+data[i].message+", is_endUser:"+data[i].is_endUser +"=="+data[i].created);
		/*var thumb_path = (data[i].dr_id == dr_id)?user_thumb_path:friend_thumb_path;
		var imageview_thumb_path = $.UI.create("ImageView", {
			top: 10,
			width: 50,
			height: "auto",
			defaultImage: "/images/default/small_item.png",
			left: 10,
			image: thumb_path
		});
		*/
		if(data[i].sender_id){
			var view_text_container = $.UI.create("View", {
				classes:  ['hsize', 'vert', 'box','rounded'],
				top: 2,
				width: "75%",
				url: data[i].message
			});
			var label_name = $.UI.create("label",{
				classes: ['h6','wfill', 'hsize', 'bold', 'small_padding'],
				left:15,
				color: "#ffffff",
				text: data[i].sender_name
			});
			
			var ss = data[i].message;
			var newText = ss.replace("[br]", "\r\n");
			var text_color = (data[i].format == "link")?"blue":"#ffffff";
			newText = (data[i].format == "link")?  newText:newText;
			console.log(data[i]);
			
			
			var label_message = $.UI.create("Label", {
				classes:['h5', 'wfill', 'hsize','small_padding'],
				top: 0,
				left:15,
				color: text_color,
				text: newText
			});
			
			var label_time = $.UI.create("Label", {
				classes:['h7', 'wfill', 'hsize','small_padding'],
				top:0,
				
				right:15,
				text: timeFormat(data[i].created)+" "+status_text[data[i].status],
				textAlign: "right"
			});
			view_text_container.add(label_name);
			if (data[i].format == "link"){
				var label_message2 = $.UI.create("Label", {
					classes:['h5', 'wfill', 'hsize','small_padding'],
					top: 0,
					left:15, 
					text: "Thanks you for contacting our call centre. \nWe would love to hear your thoughts or feedback on how we can improve your experience!\nClick below to start the survey:"
				});
				view_text_container.add(label_message2);
			}
			
			view_text_container.add(label_message);
			
			view_text_container.add(label_time);
			if(data[i].is_endUser){
				view_text_container.setBackgroundColor("#84474a");
				view_text_container.setLeft(10);
				//view_container.add(imageview_thumb_path);
			}else{
				view_text_container.setBackgroundColor("#871f28");
				//view_container.add(imageview_thumb_path);
				view_text_container.setRight(10);
			}
			if(data[i].format == "link"){
				label_message.addEventListener("click", navToWebview);
			}
			
		}else{
			var view_text_container = $.UI.create("View", {
				classes: ['wsize','hsize','box','rounded'],
				top: 10,
				backgroundColor: "#3ddaf6"
			});
			
			var label_system_msg = $.UI.create("Label",{
				classes: ['wsize', 'hsize','padding','h6'],
				text: data[i].message
			});
			view_text_container.add(label_system_msg);
		}
		
		
		view_container.add(view_text_container);
		view_container.addEventListener("longpress", function(e){
			var m_id = parent({name: "m_id"}, e.source);
			var message_box = parent({name: "m_id", value: m_id}, e.source);
			var dialog = Ti.UI.createAlertDialog({
			    cancel: 1,
			    buttonNames: ['Confirm', 'Cancel'],
			    message: 'Would you like to delete the message?',
			    title: 'Delete'
			  });
			  
		  dialog.addEventListener('click', function(ex){
   			 if (ex.index === ex.source.cancel){

   			 }else if(ex.index == 0){
   			 	var model = Alloy.createCollection("conversations");
				model.removeById(m_id);
   			 	$.inner_area.remove(message_box);
   			 }
   			});
   			dialog.show();
		});
		if(latest){
			$.inner_area.insertAt({view: view_container});
		}else{
			$.inner_area.insertAt({view: view_container, position: 0});
		}
	}
	console.log(last_uid+" != "+Ti.App.Properties.getString('dr_id'));
	
}

function closeRoom(){
	var dr_id = Ti.App.Properties.getString('dr_id') || 0;
	console.log({dr_id: dr_id, room_id: room_id});
	API.callByPost({
		url:"closeRoom", 
		params: {dr_id: dr_id, room_id: room_id}
	},{
		onload: function(responseText){
			socket.fireEvent("socket:sendMessage", {room_id: room_id});
			closeWindow();
		}
	});
}

function getConversationByRoomId(callback){
	var checker = Alloy.createCollection('updateChecker'); 
	var dr_id = Ti.App.Properties.getString('dr_id') || 0;
	var isUpdate = checker.getCheckerById(1, args.u_id);
	var last_updated = isUpdate.updated || "";
	last_update = last_updated;
	
	API.callByPost({url:"getMessage", params: {dr_id: dr_id, last_updated: last_updated, u_id: args.u_id, is_doctor: 1}}, 
		{onload: function(responseText){
				var model = Alloy.createCollection("conversations");
			
			var res = JSON.parse(responseText);
			var arr = res.data || undefined;
			console.log(res.last_updated+" res.last_updated");
			model.saveArray(arr, callback);
			checker.updateModule(1, "getMessage", res.last_updated, args.u_id);
			var update_id = _.pluck(arr, "id");
			//updateStatus(update_id);
			
			callback && callback();
		}
	});
}

function updateStatus(arr){
	for (var i=0; i < arr.length; i++) {
		var c = $.inner_area.getChildren();
		for (var b=0; b < $.inner_area.children.length; b++) {
			console.log($.inner_area.children[b].m_id+" "+arr[i]);
			if($.inner_area.children[b].m_id == arr[i]){
				var time = $.inner_area.children[b].children[0].children[2].text.split(" ");
				$.inner_area.children[b].children[0].children[2].text = time[0]+time[1]+time[2]+" Sent";
			}
		};
	};
}

function scrollToBottom(){
	$.chatroom.scrollToBottom();
}

/*
 	Refresh
 * */
function refresh(callback, firsttime){
	retry = 0;
	loading.start();
	console.log("start refresh");
	getConversationByRoomId(function(){
		callback({firsttime: firsttime});
		loading.finish();
		refreshing = false;
		var model = Alloy.createCollection("conversations"); 
		model.messageRead({dr_id: dr_id});
	});
	
}
var refreshing = false;
var time_offset = COMMON.now();
function refresh_latest(param){
	
	console.log("refresh_latest "+refreshing);
	/*if(typeof(param.admin) != "undefined"){
		Ti.App.Properties.setString('estimate_time', "0");
	}else{
		
	}*/
	console.log(time_offset+" < "+COMMON.now());
	if(!refreshing && time_offset < COMMON.now()){
		refreshing = true;
		refresh(getLatestData);
		time_offset = COMMON.now();
	}
}

function getPreviousData(param){ 
	start = parseInt(start);
	var model = Alloy.createCollection("conversations");
	console.log(dr_id+" dr_id");
	console.log(args.u_id+" args.u_id");
	data = model.getData(false, start, anchor,"", args.u_id);
	var estimate_time = Ti.App.Properties.getString('estimate_time');
	console.log(estimate_time+" estimate time");
	console.log(data.length);
	last_id = (data.length > 0)?_.first(data)['id']:last_id;
	last_update = (data.length > 0)?_.last(data)['created']:last_update;
	last_uid = (data.length > 0)?_.first(data)['sender_id']:last_uid;
	
	render_conversation(false);
	start = start + 10;
	if(typeof param.firsttime != "undefined"){ 
		setTimeout(function(e){scrollToBottom();}, 500);
	}else{
		if(OS_IOS){
			$.chatroom.setContentOffset({y: 1000}, {animated: false});
		} 
	}
 
}

function getLatestData(){
	var model = Alloy.createCollection("conversations"); 
	data = model.getData(true,"","", last_update, args.u_id); 
	
	console.log("getlatestdata");
	console.log(data);
	last_id = (data.length > 0)?_.first(data)['id']:last_id;
	last_update = (data.length > 0)?_.first(data)['created']:last_update;
	last_uid = (data.length > 0)?_.first(data)['sender_id']:last_uid;
	console.log(last_id+" args.u_id");
	render_conversation(true);
	setTimeout(function(e){scrollToBottom();}, 500);
}

function timeFormat(datetime){
	var timeStamp = datetime.split(" ");  
	var newFormat;
	var ampm = "am";
	var date = timeStamp[0].split("-");  
	if(timeStamp.length == 1){
		newFormat = date[2]+"/"+date[1]+"/"+date[0] ;
	}else{
		var time = timeStamp[1].split(":");  
		if(time[0] > 12){
			ampm = "pm";
			time[0] = time[0] - 12;
		}
		
		newFormat = date[2]+"/"+date[1]+"/"+date[0] + " "+ time[0]+":"+time[1]+ " "+ ampm;
	}
	
	return newFormat;
}

/**
 * Closes the Window
 */
function closeWindow(){
	$.win.close();
}

function init(){
	Ti.App.fireEvent("web:setRoom", {room_id: args.room_id});
	Ti.App.fireEvent("conversation:setRoom", {room_id: args.room_id});
	set_room();
	$.win.add(loading.getView());
	if(!Titanium.Network.online){
		COMMON.createAlert("Alert", "There is no internet connection.", closeWindow);
	}
	console.log(room_id+" room id");
	refresh(getPreviousData, true);
	
}

function set_room(){
	room_set = true;
	socket.addEventListener("socket:refresh_chatroom", refresh_latest);
	socket.event_onoff("socket:message_alert", false);
}

init();

Ti.App.addEventListener('conversation:refresh', refresh_latest);
$.win.addEventListener("close", function(){
	Ti.App.fireEvent('home:refresh');
	Ti.App.fireEvent("socket:leave_room", {room_id: room_id});
	socket.removeEventListener("socket:refresh_chatroom");
	socket.event_onoff("socket:message_alert", true);
	Ti.App.removeEventListener('conversation:refresh', refresh_latest);
	$.destroy();
	 
});