import React from 'react';
import { Route, BrowserRouter } from 'react-router-dom';

import Home from './pages/Home';
import CreatePoint from './pages/CreatePoint';
import FindPoint from './pages/FindPoint';
import PointDetail from './pages/PointDetail';


const Routes = () => {
  return (
    <BrowserRouter>
      <Route component={Home} path="/" exact />
      <Route component={CreatePoint} path="/create-point" />
      <Route component={FindPoint} path="/find-point" />
      <Route component={PointDetail} path="/point-detail/:id" />
    </BrowserRouter>
  );
}


export default Routes;