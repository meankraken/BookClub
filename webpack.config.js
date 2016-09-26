var path = require('path');

var APP_DIR = path.join(__dirname, "/public/");
var BUILD_DIR = path.join(__dirname, "/build");

module.exports = {
	entry: {
		main: APP_DIR + "main.js",
		profile: APP_DIR + "profile.js"
	},
	output: {
		path: BUILD_DIR,
		filename: '[name].bundle.js'
	},
	
	module: {
		loaders: [
			{
				test:/jsx?/,
				include: APP_DIR,
				exclude: /node_modules/,
				loader:'babel'
			}
		
		]
	}
	
	
};