const {spawn} = require('child_process');
const http = require('http');
const fs = require('fs');
const url = require('url');
const countyModel = require('./models/countyCases');
const lastUpdatedModel = require('./models/lastUpdatedModel');
const mongoose = require('mongoose');
const args = process.argv.slice(2);

const memjs = require('memjs');
const client = memjs.Client.create(process.env.MEMCACHEDCLOUD_SERVERS, {
	username: process.env.MEMCACHEDCLOUD_USERNAME,
	password: process.env.MEMCACHEDCLOUD_PASSWORD
});

require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// When successfully connected
mongoose.connection.on('connected', () => {
	console.log('Established Mongoose Default Connection');
});

// When connection throws an error
mongoose.connection.on('error', err => {
	console.log('Mongoose Default Connection Error : ' + err);
});
// Get new data every week
const checkForData = async () => {
	client.get("oldDate", async (err, value) => {
		try {
			let oldDateObj = null;
			if (value) {
				oldDateObj = JSON.parse(value);
				console.log('Got date from cache');
			} else {
				oldDateObj = await lastUpdatedModel.findOne({"name": "update-check"});
				console.log(oldDateObj);
				client.set("oldDate", JSON.stringify(oldDateObj), {expires: 0});
				console.log('Got date from db, updated cache');
			}
			const oldDate = oldDateObj.date;
			const currDate = new Date();
			const oneDayInMs = 24 * 60 * 60 * 1000;
			const differenceInMs = currDate.getTime() - Date.parse(oldDate);
			const diffInDays = Math.floor(differenceInMs/oneDayInMs);
			if (diffInDays >= 7) {
				console.log("Updating data...")
				// spawn new child process to call the python script
				const python = spawn('python', ['./CovidServer/covid.py']);

				python.on('close', (code) => {
					client.delete("oldDate");
					lastUpdatedModel.updateOne(
						{
							name: 'update-check',
						}, 
						{
							date: currDate,
							status: code
						}
					).then((res) => {
						if (res.nModified === 1 && code === 0) {
							console.log("Data updated!")
						} else {
							console.log("Error, data did not update correctly");
						}
					}).then(() => {
						console.log(`child process close all stdio with code ${code}`);
					});
				});

				python.on('error', (error) => {
					console.log(`child process close all stdio with error ${error}. 
									Data did not update correctly`);
				});
			} else {
				console.log("Data up to date");
			}
		} catch (error) {
			console.log(error);
		}
	});
}

// create server object
http.createServer(async (req, res) => {
	let path = '.' + url.parse(req.url, true).pathname;
	console.log(path);
    if (path === './') {
		path = './index.html' ;
    } else if (path.endsWith('/api/countyData')) {
		res.writeHead(200, {'Content-type': 'application/json'});
		const county = await countyModel.findOne({"name": req.headers.name});
		res.write(JSON.stringify(county));
		return res.end();
	}
    fs.readFile(path, (err,data) => {
		if (err) {
			res.writeHead(404, {'Content-type': 'text/html'});
			return res.end("404 Not Found");
		} else if (path.endsWith('bundle.js')) {
			checkForData();
			res.writeHead(200, {'Content-type': 'application/javascript'} )
		} else if (path.endsWith('.js')) {
			res.writeHead(200, {'Content-type': 'application/javascript'} )
		} else if (path.endsWith('.json')) {	    
			res.writeHead(200, {'Content-type': 'application/json'});
		} else if (path.endsWith('.html')) {
			res.writeHead(200, {'Content-type': 'text/html'});
		} else if (path.endsWith('.pdf')) {
			res.writeHead(200, {'Content-type': 'application/pdf'});
		} else {
			res.writeHead(200, {'Content-type': 'text/css'});
		}
		res.write(data);
		return res.end();
	});
}).listen(args[0]);

