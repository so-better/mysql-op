const path = require('path')
module.exports = {
	entry: './src/index.js', //入口文件
	output: { //输出
		path: path.resolve(__dirname, 'dist'),
		filename: "mysql-op.js",
		library: 'SqlUtil',
		libraryTarget: "umd"
	}
}
