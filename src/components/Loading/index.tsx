import React from 'react';

import './styles.css';

import loadingGif from '../../assets/loadingGif3.gif';

const Loading = () => {
  return (
    <div className='loader-container'>
      <div className="loader-content">
        <h1>Cadastrando ponto de coleta...</h1>
      </div>
      <div className='loader'>
        <img src={loadingGif} width={120} height={120} alt='loading' />
      </div>
    </div>
  );
}

export default Loading;