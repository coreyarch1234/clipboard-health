/* eslint-disable global-require */
import 'dotenv/config';
import reactApp from './views/app';


const routes = (app) => {

  //Get ratios
  app.get('/api/records/ratios', require('./api/ratios'));


  reactApp(app); // set up react routes
};

export default routes;
/* eslint-enable global-require */
