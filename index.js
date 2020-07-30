const Plotly = require('plotly.js-dist');
const submit = document.querySelector('#submit');
const input = document.querySelector('#input');
const responseField = document.querySelector('#responseField');
const plot = document.querySelector('#graph');

async function processData() {
    const response = await fetch('CovidData/covid-data.json')
    let jsonResponse = await response.json();
    let county = input.value;
    if (response.ok) {
	renderResponse(jsonResponse, county);
    } else {
	renderError(response.status);
    }
}

function renderResponse(response, county) {
    if (response.hasOwnProperty(county)) {	
	let c = response[county];
	Plotly.plot(plot, [{
	    x: c.week,
	    y: c.cases}], { 
		margin: { t: 0 } }, {showSendToCloud:true} );
    } else {
	renderError("Invalid county");
    }
}

function renderError(error) {
    responseField.innerHTML = `<p>Error: ${error}<p>`;
}
const displayData = event => {
    event.preventDefault();
    processData();
}

submit.addEventListener('click', displayData);
