var WerWolf = WerWolf || {};

WerWolf.Game = function(tabName, title, click) {
	var thisref = this;
	this.tab = UI.CreateTab(tabName, title, click);
	this.content = UI.CreateLoadingIndicator();
	
	this.Attach = function() {
		thisref.tab.appendTo($(".tab-container"));
	};
	
	this.Activate = function() {
		$(".tab-button.active").removeClass("active");
		thisref.tab.addClass("active");
		var parent = thisref.tab.parent();
		thisref.tab.insertBefore(parent.children().eq(0));
		$(".main-content").children().remove();
		thisref.content.appendTo($(".main-content"));
	};
	
	this.Remove = function() {
		thisref.tab.remove();
		thisref.content.remove();
		for (var i = 0; i<Data.Games.length; ++i)
			if (Data.Games[i] == thisref) {
				Data.Games.splice(i, 1);
				break;
			}
	};
	
	Data.Games.push(this);
};

WerWolf.AddGame = function() {
	var thisref = this;
	WerWolf.Game.call(this, "+", Lang.Get("newTabName"), function() {
		thisref.Activate();
	});
	
	var activate = this.Activate;
	this.Activate = function() {
		if (Data.NewGameTab != null) return;
		var game = new WerWolf.NewGame();
		game.Attach();
		game.Activate();
	};
};
WerWolf.AddGame.prototype = Object.create(WerWolf.Game.prototype);

WerWolf.NewGame = function() {
	var thisref = this;
	WerWolf.Game.call(this, Lang.Get("newGameTabName"), 
		Lang.Get("newTabName"), function() {
			thisref.Activate();
		});
	Data.NewGameTab = this;
	this.content = UI.CreateNewGameBox(function(){
		var name = thisref.content.find(".newGroupName").val();
		if (name == "") {
			alert(Lang.Get("insertNameMessage"));
			return;
		}
		Logic.ApiAccess.CreateGroup(name, Data.UserId);
	}, function() {
		var key = thisref.content.find(".joinGroupKey").val();
		if (key == "") {
			alert(Lang.Get("insertKeyMessage"));
			return;
		}
		Logic.ApiAccess.AddUserToGroupByKey(Data.UserId, key);
	});
	var remove = this.Remove;
	this.Remove = function() {
		remove();
		Data.NewGameTab = null;
	};
};
WerWolf.NewGame.prototype = Object.create(WerWolf.Game.prototype);

WerWolf.RunningGame = function(id, data) {
	var thisref = this;
	WerWolf.Game.call(this, data.name, data.name, function(){
		thisref.Activate();
	});
	this.id = id;
	this.data = data;
	this.content = UI.CreateUserFrame();
	Data.CurrentGames[id] = this;
	
	this.LoopEvents = [];
	var intervall = setInterval(function(){
		if (thisref.LoopEvents.length > 0) {
			var d = [];
			for (var i = 0; i<thisref.LoopEvents.length; ++i) {
				if (thisref.LoopEvents[i] instanceof Function) {
					var res = thisref.LoopEvents[i]();
					if (Array.isArray(res))
						d = d.concat(res);
					else d.push(res);
				}
				else d.push(thisref.LoopEvents[i]);
			}
			Logic.ApiAccess.Multi(d);
		}
	}, 1000);
	
	var updateUserNames = function(data) {
		thisref.content.find(".user-entry.entry-"+data.user)
			.find(".user-name").text(data.name);
	};
	Logic.RequestEvents.getAccountName.add(updateUserNames);
	
	this.LoopEvents.push(JSON.stringify({
		mode: "setUserOnline",
		group: id,
		user: Data.UserId
	}));
	this.UpdateUserOnline = function(users) {
		var container = thisref.content.find(".user-list");
		var now = Date.now() / 1000;
		var nds = new Date(now * 1000).toDateString();
		for (var i = 0; i<users.length; ++i) {
			var entry = container.find(".entry-"+users[i].user);
			if (entry.length == 0) continue;
			entry = entry.find(".user-online");
			var date = new Date(users[i].lastOnline * 1000);
			var ods = date.toDateString();
			var dif = now - users[i].lastOnline;
			var text = "";
			if (users[i].lastOnline == 0) text = "?";
			else if (dif < 10) text = Lang.Get("lastOnlineTime", "online");
			else if (dif < 60) text = Lang.Get("lastOnlineTime", "recently");
			else if (dif < 300) text = Lang.Get("lastOnlineTime", "afewminutes");
			else if (nds == ods) text = date.toLocaleTimeString();
			else text = date.toLocaleDateString();
			entry.text(text);
			entry.attr("title", users[i].lastOnline == 0 ? '?' : date.toLocaleString());
		}
	};
	
	var remove = this.Remove;
	this.Remove = function() {
		clearInterval(intervall);
		Logic.RequestEvents.getAccountName.remove(updateUserNames);
		remove();
		Data.CurrentGames[id] = undefined;
	};
	
	this.userList = [];
	this.UpdateUser = function(user) {
		thisref.userList = user;
		thisref.content.find(".user-count").text(""+user.length);
		var container = thisref.content.find(".user-list");
		var request = [];
		for (var i = 0; i<user.length; ++i) {
			var entry = container.find(".entry-"+user[i]);
			if (entry.length == 0) {
				var roles = [];
				if (data.leader == user[i]) roles.push("leader");
				else roles.push("member");
				var name = Data.UserIdNameRef[user];
				entry = UI.CreateUserEntry(user[i], name, roles);
				entry.appendTo(container);
				if (name == undefined)
					request.push(JSON.stringify({
						mode: "getAccountName",
						user: user[i]
					}));
			}
		}
		if (request.length>0)
			Logic.ApiAccess.Multi(request);
		thisref.content.find(".user-frame .loading-frame").remove();
	};
};
WerWolf.RunningGame.prototype = Object.create(WerWolf.Game.prototype);

WerWolf.PrepairGame = function(id, data) {
	WerWolf.RunningGame.call(this, id, data);
	var thisref = this;
	//fallback
	if (data.currentGame != null) {
		thisref.Remove();
		return;
	}
	//normal
	this.LoopEvents.push(JSON.stringify({
		mode: "getUserFromGroup",
		group: this.id
	}));
	
	this.UpdateGroupInfo = function(data) {
		if (data.currentGame != null) {
			thisref.Remove();
			var game = new WerWolf.PlayGame(data.id, data);
			game.Attach();
			game.Activate();
			setTimeout(function(){
				location.reload();
			}, 500);
		}
	};
	
	this.UpdateGameData = function(game) {
		//Do nothing
	};
	
	var frame = this.content.find(".game-frame");
	frame.children().remove();
	if (data.leader == Data.UserId) {
		frame.append(UI.CreateGamePreSettings(data.name, 
			data.enterKey, 0, function() {
				var roles = [];
				var inputs = thisref.content.find(".role-ammount");
				for (var i = 0; i<inputs.length; ++i) {
					var val = inputs.eq(i).val()*1;
					var key = inputs.eq(i).attr("data-role");
					if (key == 'storytel') continue; //implicit given
					for (var n = 0; n<val; ++n)
						roles.push(key);
				}
				Logic.ApiAccess.CreateGame(id, roles);
				thisref.Remove();
				var game = new WerWolf.PlayGame(data.id, data);
				game.Attach();
				game.Activate();
				setTimeout(function(){
					location.reload();
				}, 500);
			}));
	}
	else {
		frame.append(UI.CreateMemberWaitScreen());
		this.LoopEvents.push(JSON.stringify({
			mode: "getGroup",
			group: this.id
		}));
	}
};
WerWolf.PrepairGame.prototype = Object.create(WerWolf.RunningGame.prototype);

WerWolf.PlayGame = function(id, data) {
	var thisref = this;
	WerWolf.RunningGame.call(this, id, data);
	//fallback
	if (data.currentGame == null) {
		thisref.Remove();
		return;
	}
	//normal
	Data.RunningGames[data.currentGame.id] = this;
	this.LoopEvents.push(JSON.stringify({
		mode: "getGame",
		game: data.currentGame.id
	}));
	
	Logic.ApiAccess.Multi([JSON.stringify({
		mode: "getUserFromGroup",
		group: this.id
	}),JSON.stringify({
		mode: "getPlayer",
		game: data.currentGame.id,
		user: Data.UserId,
		me: Data.UserId
	}),JSON.stringify({
		mode: "getAccessibleChatRooms",
		game: data.currentGame.id,
		user: Data.UserId
	})]);
	
	this.UpdateGroupInfo = function(data) {
		if (data.currentGame == null) {
			thisref.Remove();
			var game = new WerWolf.PrepairGame(data.id, data);
			game.Attach();
			game.Activate();
		}
	};
	
	var lastPhase = null;
	var currentGame = null;
	var lastGame = {};
	var rooms = {};
	this.UpdateGameData = function(game) {
		currentGame = game;
		if (lastPhase != game.phase.current) {
			lastPhase = game.phase.current;
			console.log(game.phase.current, game.phase.currentLevel);
			thisref.OrderTabs();
			for (var key in rooms)
				Logic.ApiAccess.GetPlayerInRoom(key);
		}
		if (game.finished != null && lastGame.finished == null) {
			var rooms = thisref.content.find(".chat-room-box");
			for (var i = 0; i<rooms.length; ++i) {
				var room = rooms.eq(i);
				if (room.hasClass("chat-story")) {
					room.addClass("show").addClass("open");
					var cont = room.find(".chat-room-chats-container");
					cont.find(".vote-box").remove();
					cont.append(UI.CreateNewGameChatBox(function(){
						Logic.ApiAccess.RemoveCurrentGame(data.id);
					}));
				}
				else {
					room.removeClass("show");
					if (!room.hasClass("chat-common"))
						room.addClass("over").removeClass("open");
					else room.addClass("c-over").addClass("open");
				}
			}
			thisref.LoopEvents.push(JSON.stringify({
				mode: "getGroup",
				group: thisref.id
			}));
		}
		lastGame = game;
	};
	
	var updateUserCalled = false;
	var updateUser = this.UpdateUser;
	this.UpdateUser = function(user) {
		updateUser(user);
		if (!updateUserCalled){
			updateUserCalled = true;
			for (var i = 0; i<user.length; ++i) {
				thisref.LoopEvents.push(JSON.stringify({
					mode: "getPlayer",
					game: data.currentGame.id,
					user: user[i],
					me: Data.UserId
				}));
			}
		}
	}
	
	var playerList = {};
	this.UpdatePlayer = function(player) {
		playerList[player.user] = player;
		var elem = this.content.find(".user-entry.entry-"+player.user)
			.find(".user-roles");
		for (var i = 0; i<player.roles.length; ++i) {
			var key = player.roles[i].roleKey;
			if (elem.find(".role-"+key).length == 0) {
				UI.CreateRole(key).appendTo(elem);
			}
		}
		if (!player.alive) {
			var key = "death";
			if (elem.find(".role-"+key).length == 0) {
				UI.CreateRole(key).appendTo(elem);
			}
		}
		if (player.user == Data.UserId) {
			var cont = thisref.content.find(".h-container-i");
			if (player.alive) cont.removeClass("death");
			else cont.addClass("death");
		}
	};
	
	this.UpdateRoom = function(room) {
		var cont = thisref.content.find(".h-container-i");
		for (var key in room) {
			if (!room.hasOwnProperty(key)) continue;
			if (rooms[key] == undefined) {
				rooms[key] = {
					id: key,
					last: 0,
					access: room[key],
					player: [],
					chats: [],
					box: UI.CreateChatBox(
						room[key].chatmode, key, function(){
							var key = $(this).attr("data-id");
							var ta = rooms[key].box.find("textarea");
							var text = ta.val();
							if (text!="") {
								Logic.ApiAccess.AddChat(key, Data.UserId, text);
							}
							ta.val("");
						}).appendTo(cont)
				};
				if (!room[key].enableWrite)
					rooms[key].box.addClass("readonly");
				Data.ChatRoomGames[key] = thisref;
				thisref.LoopEvents.push(JSON.stringify({
					mode: "getChatRoom",
					chat: key
				}));
				Logic.ApiAccess.GetPlayerInRoom(key);
			}
		}
	};
	this.OrderTabs = function() {
		var score = function(p) {
			var v = 0;
			v += (p.hasClass("open")          ? 1 : 0) * 16;
			v += (p.hasClass("chat-story")    ? 1 : 0) *  8;
			v += (p.hasClass("chat-common")   ? 0 : 1) *  4;
			v += (p.hasClass("chat-lovepair") ? 0 : 1) *  2;
			v += (p.hasClass("readonly")      ? 0 : 1) *  1;
			return v;
		};
		var cont = thisref.content.find(".h-container-i");
		childs = cont.children().sort(function(a, b) {
			return score($(b)) - score($(a));
		});
		childs.removeClass("show");
		childs.eq(0).addClass("show");
		childs.appendTo(cont);
		var logs = childs.find(".chat-room-chats");
		for (var i = 0; i<logs.length; ++i)
			logs[i].scrollTop = logs[i].scrollHeight;
	};
	this.UpdateRoomData = function(room) {
		//console.log(room);
		var old = rooms[room.id].data;
		rooms[room.id].data = room;
		//Game finished
		if (currentGame.finished != null) return;
		//open states
		var modified = false;
		if (room.opened) {
			if (!rooms[room.id].box.hasClass("open")) {
				rooms[room.id].box.addClass("open");
				modified = true;
			}
		}
		else {
			if (rooms[room.id].box.hasClass("open")) {
				rooms[room.id].box.removeClass("open");
				modified = true;
			}
		}
		if (modified) {
			thisref.OrderTabs();
		}
		//enableVotings
		if (Data.UserId == data.leader) {
			if (room.enableVoting)
				rooms[room.id].box.addClass("enable-poll");
			else rooms[room.id].box.removeClass("enable-poll");
		}
		else {
			if (room.enableVoting && room.chatMode != 'story' && room.voting != null)
				rooms[room.id].box.addClass("enable-poll");
			else rooms[room.id].box.removeClass("enable-poll");
		}
		//Votings
		if (room.chatMode != 'story') {
			if (data.leader == Data.UserId) {
				//no voting in this round exists
				if (room.voting == null && (old == null || old.voting != null)) {
					rooms[room.id].box.find(".vote-box").remove();
					rooms[room.id].box.find(".chat-room-chats-container")
						.append(UI.CreateVoteBoxStartVote(room.id, room.chatMode, function() {
							Logic.ApiAccess.CreateVoting(room.id, 0);
						}));
				}
				//voting exists but its over
				else if (room.voting != null && room.voting.voteEnd != null &&
				(old == null || old.voting == null || old.voting.voteEnd == null)) {
					rooms[room.id].box.find(".vote-box").remove();
					rooms[room.id].box.find(".chat-room-chats-container")
						.append(UI.CreateVoteOverBox());
				}
				//voting exists
				else if (room.voting != null && room.voting.voteEnd == null && 
				(old == null || old.voting == null)) {
					rooms[room.id].box.find(".vote-box").remove();
					rooms[room.id].box.find(".chat-room-chats-container")
						.append(UI.CreateVoteBoxEndVote(room.id, room.chatMode, function() {
							Logic.ApiAccess.EndVoting(room.id);
						}));
				}
			}
			else {
				//no voting in this round exists
				if (room.voting == null && (old == null || old.voting != null)) {
					rooms[room.id].box.find(".vote-box").remove();
				}
				//voting exists but its over
				else if (room.voting != null && room.voting.voteEnd != null &&
				(old == null || old.voting == null || old.voting.voteEnd == null)) {
					rooms[room.id].box.find(".vote-box").remove();
					rooms[room.id].box.find(".chat-room-chats-container")
						.append(UI.CreateVoteOverBox());
				}
				//voting exists
				else if (room.voting != null && (old == null || old.voting == null)) {
					Logic.ApiAccess.GetVoteFromPlayer(room.id, Data.UserId);
				}
			}
		}
		//Next round
		else if (data.leader == Data.UserId) {
			if (old == null || old.added == null) {
				room.added = true;
				if (old != null) old.added = true;
				rooms[room.id].box.find(".vote-box").remove();
				rooms[room.id].box.find(".chat-room-chats-container")
					.append(UI.CreateNextRoundBox(function() {
						Logic.ApiAccess.NextRound(currentGame.id);
					}));
			}
		}
	};
	this.ShowClientVoteBox = function(id, hasVote) {
		var cont = rooms[id].box.find(".chat-room-chats-container");
		if (cont.children().filter(".singleVote").length>0) {
			cont.find(".own-votes").remove();
		}
		else {
			var list = [];
			if (!hasVote) {
				for (var i = 0; i<thisref.userList.length; ++i) {
					if (thisref.userList[i] == data.leader) continue;
					if (!playerList[thisref.userList[i]].alive) continue;
					list[thisref.userList[i]] = Data.UserIdNameRef[this.userList[i]];
				}
			}
			else list = null;
			rooms[id].box.find(".chat-room-chats-container")
				.append(UI.CreateVoteBoxSingleVote(id, rooms[id].data.chatMode, 
				list, function(_id){
					Logic.ApiAccess.AddVote(id, Data.UserId, _id);
				}));
		}
	};
	this.UpdateRoomPlayer = function(room, player) {
		rooms[room].player = player;
		var box = rooms[room].box.find(".player-smal-box");
		rooms[room].box.attr("data-player-count", player.length);
		for (var i = 0; i<player.length; ++i) {
			var elem = box.find(".entry-"+player.user);
			if (elem.length == 0 && player[i].alive)
				box.append(UI.CreateSinglePlayerView(
					player[i].user, Data.UserIdNameRef[player[i].user]));
			if (elem.length > 0 && !player[i].alive)
				elem.remove();
		}
	};
	this.UpdateVotes = function(room, votes) {
		var bar = rooms[room].box.find(".cur-vote-bar").children().eq(0);
		var max = rooms[room].player.length-1;
		var stat = max <= 0 ? 100 : 100 * votes.length / max;
		bar.css("width", stat + "%");
	};
	this.HandleNewChat = function(room, chat) {
		if (chat.length == 0) return;
		var log = rooms[room].box.find(".chat-room-chats");
		var treshhold = 16; //16px extra
		var doscroll = log[0].scrollTop + log[0].clientHeight >= log[0].scrollHeight - treshhold;
		for (var i = 0; i<chat.length; ++i) {
			if (rooms[room].chats.includes(chat[i].id)) continue;
			rooms[room].chats.push(chat[i].id);
			if (rooms[room].last < chat[i].sendDate)
				rooms[room].last = chat[i].sendDate;
			var name =chat[i].user == 0 ? Lang.Get("roles", "log") :
				Data.UserIdNameRef[chat[i].user];
			var text = chat[i].user == 0 ? Lang.GetSys(chat[i].text) :
				chat[i].text;
			var entry = UI.CreateChatSingleEntry(name,
				new Date(chat[i].sendDate*1000).toLocaleString(), text
			);
			entry.appendTo(log);
		}
		if (rooms[room].chats.length > 50)
			rooms[room].chats.splice(0, rooms[room].chats.length-50);
		if (doscroll) {
			log[0].scrollTop = log[0].scrollHeight;
		}
	};
	this.LoopEvents.push(function() {
		var d = [];
		for (var key in rooms) {
			if (rooms.hasOwnProperty(key)) {
				d.push(JSON.stringify({
					mode: "getLastChat",
					chat: rooms[key].id,
					since: rooms[key].last
				}));
				if (rooms[key].data != null && rooms[key].data.voting != null)
					d.push(JSON.stringify({
						mode: "getVotesFromRoom",
						chat: rooms[key].id
					}));
			}
		}
		return d;
	});
	
	var frame = this.content.find(".game-frame");
	frame.children().remove();
	frame.append(UI.CreateChatBoxContainer());
	
	var remove = this.Remove;
	this.Remove = function() {
		remove();
		Data.RunningGames[data.currentGame.id] = undefined;
	};
};
WerWolf.PlayGame.prototype = Object.create(WerWolf.RunningGame.prototype);


