import React, {useEffect, useState} from 'react';
import { useRouteMatch, Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

import './styles.css';
import logo from '../../assets/logo.svg';
import api from '../../services/api';

interface PointDetailParams {
  id: string;
}

interface Data {
  serializedPoint: {
    image: string;
    image_url: string;
    name: string;
    email: string;
    whatsapp: string;
    city: string;
    uf: string;
  },
  items: {
    title: string;
  }[]
}

const PointDetail: React.FC = () => {
  const { params } = useRouteMatch<PointDetailParams>();
  const [data, setData] = useState<Data>({} as Data)
  const [erroBuscaPonto, setErroBuscaPonto] = useState('');

  useEffect(() => {
    
    if(params.id){
      api.get(`/points/${params.id}`)
        .then(response => {
          setData(response.data);
        })
        .catch(error => {
          console.log(`Erro ao tentar buscar ponto ${error}`);
          setErroBuscaPonto('Erro ao tentar buscar informações do ponto de coleta');
        });
    }
    
  },[params.id]);

  return (
    <>
      {
        !data.serializedPoint ? ( <h1>{erroBuscaPonto}</h1>) :
        (
          <div id="page-point-detail">
            <header>
                <img src={logo} alt="Ecoleta"/>
                <Link to="/find-point">
                  <FiArrowLeft />
                  Voltar para busca
                </Link>
              </header>
            <div className="content">
              <img src={data.serializedPoint.image_url} alt={data.serializedPoint.image}/>
              <h1>{data.serializedPoint.name}</h1>
              <span>{data.items.map(item => item.title).join(', ')}</span>
              
              <div className="dados">
                <div className="dados-endereco">
                  <h2>Endereço</h2>
                  <span>{data.serializedPoint.city}, {data.serializedPoint.uf}</span>
                </div>
                <div className="dados-email">
                  <h2>Email</h2>
                  <span>{data.serializedPoint.email}</span>
                </div>
                <div className="dados-email">
                  <h2>Whatsapp</h2>
                  <span>{data.serializedPoint.whatsapp}</span>
                </div>
              </div>
            </div>
          </div>
        )
      }
    
    </>
  );
}

export default PointDetail;