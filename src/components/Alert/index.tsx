import React from 'react';

import './styles.css';

import { FiCheckCircle } from 'react-icons/fi';

const Alert = () => {
  return (
    <div className='alert-container'>
      <div className="alert-content">
        <h1>Ponto de coleta cadastrado com sucesso</h1>
      </div>
      <div className='alert'>
        <FiCheckCircle />
      </div>
    </div>
  );
}

export default Alert;