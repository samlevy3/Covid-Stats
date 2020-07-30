
const {spawn} = require('child_process');
const http = require('http');
const fs = require('fs');
const url = require('url');
const args = process.argv.slice(2)
// create server object
http.createServer((req, res) => {
    let path = '.' + url.parse(req.url, true).pathname;
    console.log(path);
    // Get new data every week
    setInterval(function() {
	// spawn new child process to call the python script
	const python = spawn('python', ['covid.py']);
	// collect data from script
	python.on('close', (code) => {
            console.log(`child process close all stdio with code ${code}`);
	});
    }, 604800000);
    if (path === './') {
	path = './index.html';
    }
    fs.readFile(path, (err,data) => {
	if (err) {
	    res.writeHead(404, {'Content-type': 'text/html'});
	    return res.end("404 Not Found");	    
	} else if (path === './CovidData/covid-data.json') {
	    res.writeHead(200, {'Content-type': 'application/json'});
	} else {
	    res.writeHead(200, {'Content-type': 'text/html'});
	}
	res.write(data);
        return res.end();
    });
}).listen(args[0]);

