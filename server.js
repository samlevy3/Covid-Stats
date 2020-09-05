const {spawn} = require('child_process');
const http = require('http');
const fs = require('fs');
const url = require('url');
const args = process.argv.slice(2)
const countyModel = require('./models/countyCases');
const lastUpdatedModel = require('./models/lastUpdatedModel');
const axios = require('axios');
const mongoose = require('mongoose');
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
const oldDateObj = lastUpdatedModel.findOne({"name": "update-check"}).then((res) => {
	const oldDate = res.date;
	const currDate = new Date();
	const oneDayInMs = 24 * 60 * 60 * 1000;
	const differenceInMs = currDate.getTime() - oldDate.getTime();
	const diffInDays = Math.floor(differenceInMs/oneDayInMs);
	if (diffInDays >= 7) {
		console.log("Updating data...")
		// spawn new child process to call the python script
		const python = spawn('python', ['./CovidServer/covid.py']);

		python.on('close', (code) => {
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
})

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

