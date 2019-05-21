// モジュール関係の読み込み
const http = require("http");
const mongodb = require('mongodb');
const fs = require("fs");
const ejs = require("ejs");
const qs = require("querystring");

// settings.jsの読み込み
const settings = require("./settings");
// console.log("settings.js " + JSON.stringify(settings));
const host = settings.host;
const port = settings.port;
const dbname = settings.dbname;
const postCollection = settings.postCollection;
const postField = settings.postField;
const nameField = settings.nameField;

const url = "mongodb://" + host + "/" + dbname;
console.log(url);
const MongoClient = mongodb.MongoClient;
var db;

var template = fs.readFileSync(__dirname + "/html/bbs.ejs", "utf-8");

//投稿されたデータ
// var posts = [];

MongoClient.connect(url, {useNewUrlParser: true}, function(err, client){
	if(err){
		return console.dir(err);
	}
	console.log("Connected successfully to server");
	db = client.db(dbname);
});

// httpサーバーを生成
const server = http.createServer();
server.on("request", function(req, res){

	var tmp = req.url.split(".");
	var ext = tmp[tmp.length-1];
	var path = '.' + req.url;

	switch(ext){
		case '/':
			if(req.method == "POST"){
				req.data = "";
				req.on("data", function(data){
					req.data += data;
				});
				req.on("end", function(){
					var query = qs.parse(req.data);
					savePosts(query);
					renderForm(res);
				});
			}else{
				renderForm(res);
			}
			break;
		case 'css': //style.css以外でも取る
			fs.readFile(path, function(err, data){
			res.writeHead(200, {"Content-Type": "text/css"});
			res.end(data, "utf-8");
			});
			break;
		default:
			res.writeHead(404, {"Content-Type": "text/html"});
			res.write("<h1>404 not found</h1>");
			res.end();
	}
});

server.listen(port, host, function(){
	console.log(`server running at http://${host}:${port}/`);
});

function renderForm(res){
	var posts = [];
	var names = [];
	getPosts(function(data){
		for(let row of data){
			posts.push(row[postField]);
			names.push(row[nameField]);
		}
		var data = ejs.render(template, {
			posts: posts,
			names: names
		});
		res.writeHead(200, {"Content-Type": "text/html"});
		res.end(data, "utf-8");
	});
}

var savePosts = function(data){
	db.collection(postCollection).insertOne({post: data[postField], name: data[nameField]});
}

var getPosts = function(callback){
	db.collection(postCollection).find().toArray(function(err, data){
		callback(data);
	})
}