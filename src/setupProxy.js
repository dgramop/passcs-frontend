const { createProxyMiddleware } = require('http-proxy-middleware');
module.exports = function(app) {
  app.use(
    '/api/*',
    createProxyMiddleware({
      target: 'http://127.0.0.1:8000',
      //target: 'https://passcs.io', //make sure to comment out pathRewrite if you're doing this!
      changeOrigin: true,
			pathRewrite: {
        '^/api/*': '/'
			},
    })
  );
};
