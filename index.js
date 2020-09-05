const Plotly = require('plotly.js-dist');
const submit = document.querySelector('#submit');
const input = document.querySelector('#input');
const responseField = document.querySelector('#responseField');
const plot = document.querySelector('#graph');
const axios = require('axios');

async function processData() {
    try {	
		const response = await axios.get('api/countyData', {
			headers: { "name": input.value }
		});
		if (response.status === 200) {
			renderResponse(response.data, input.value);
		} else {
			renderError(response.status);
		}
    } catch (err) {
		renderError(err);
    }
}

function renderResponse(response, county) {
    try {	
		if (response && county) {	
			Plotly.plot(plot, [{
			x: response.weeks,
			y: response.cases, name: county}], { 
				margin: { t: 0 }, showlegend: true}, {displayModeBar: false});
		} else {
			renderError("Invalid county");
		}
    } catch (err) {
		renderError(err);
	}
}

function renderError(error) {
    alert(`Error: ${error}`);
}
const displayData = event => {
    event.preventDefault();
    processData();
}

submit.addEventListener('click', displayData);