// This returns and prints a JSON list of all players, which we can parse the first and last names from
const http = require('https');

const options = {
	method: 'GET',
	hostname: 'api-football-v1.p.rapidapi.com',
	port: null,
	path: '/v3/players/profiles',
	headers: {
		'x-rapidapi-key': '4acbca8e15msh36930cfebff6dffp1f17a4jsn00e6d00a7042',
		'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
	}
};

const req = http.request(options, function (res) {
	const chunks = [];

	res.on('data', function (chunk) {
		chunks.push(chunk);
	});

	res.on('end', function () {
		const body = Buffer.concat(chunks);
		console.log(body.toString());
	});
});

req.end();