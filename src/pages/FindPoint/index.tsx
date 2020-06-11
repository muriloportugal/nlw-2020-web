import React, { useState, useEffect, ChangeEvent} from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker, Popup } from 'react-leaflet';
import axios from 'axios';

import './styles.css';
import logo from '../../assets/logo.svg';
import api from '../../services/api';


interface Item {
  id: number;
  title: string;
  image_url: string;
}

interface IBGEUFResponse {
  sigla: string;
}

interface IBGECityResponse {
  nome: string;
}

interface Point {
  id: number;
  image: string;
  image_url: string;
  name: string;
  latitude: number;
  longitude: number;
}

const FindPoint = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [ufs, setUfs] = useState<string[]>([]);
  const [selectedUf, setSelectedUf] = useState('0');
  const [cities, setCities] = useState<string[]>([])
  const [selectedCity, setSelectedCity] = useState('0');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [initialPosition, setInitialPosition] = useState<[number,number]>([-23.5682032,-46.7194634]);
  const [points, setPoints] = useState<Point[]>([]);

  // Busca os itens que podem ser reciclados e suas imagens
  useEffect(() => {
    api.get('/items').then(response => {
      setItems(response.data);
    }).catch(error => console.log(`Erro ao buscar itens recicláveis ${error}`));
  }, []);

  // Busca localização
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        setInitialPosition([latitude,longitude]);
      },
      error => {
        console.log(`Erro ao tentar buscar geolocalização ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
    );
  }, []);

  // Busca todos os estados da api do IBGE
  useEffect(() => {
    axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(response => {
        const ufInitials = response.data.map(uf => uf.sigla);
        setUfs(ufInitials);
      }).catch(error => console.log(`Erro ao buscar UF IBGE ${error}`));
  }, []);

  // Busca todas as cidades referente ao estado que o usuário selecionou
  useEffect(() => {
    if(selectedUf === '0'){
      return;
    }
    axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios?orderBy=nome`)
      .then(response => {
        const cityNames = response.data.map(city => city.nome);
        setCities(cityNames);
      }).catch(error => console.log(`Erro ao buscar cidades IBGE ${error}`));
  }, [selectedUf]);

  //Busca os pontos de coleta
  useEffect( () => {
    if(selectedItems.length > 0 && selectedUf && selectedCity){
      api.get('/points',{
        params: {
          city: selectedCity,
          uf: selectedUf,
          items: selectedItems
        }
      }).then(response => {
        setPoints(response.data)
      })
      .catch(error => {
        console.log(`Erro ao buscar pontos ${error.message}`);
        alert('Erro ao tentar buscar pontos de reciclagem');
      });
    }
    if(selectedItems.length === 0) {
      //Se não tiver nenhum item de coleta selecionado apaga os markers
      setPoints([]);
    }
    
  },[selectedCity,selectedUf,selectedItems]);

  function handleSelectUf(event: ChangeEvent<HTMLSelectElement>) {
    const uf = event.target.value;
    setSelectedUf(uf);
  }

  function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
    const city = event.target.value;
    setSelectedCity(city);
  }

  function handleSelectItem(id: number) {
    const alreadySelected = selectedItems.findIndex(item => item === id);

    if(alreadySelected >= 0){
      const filteredItems = selectedItems.filter(item => item !== id)
      setSelectedItems(filteredItems);
    }else {
      setSelectedItems([...selectedItems, id ]);
    }

    
  }

  return (
    <div id="page-find-point">
      <header>
        <img src={logo} alt="Ecoleta"/>
        <Link to="/">
          <FiArrowLeft />
          Voltar para home
        </Link>
      </header>
      <div className="content">
      <h1>Busca pelo<br/>ponto de coleta</h1>
        <fieldset>
          <legend>
            <h3>Informe o estado e cidade da coleta</h3>
          </legend>
          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado (UF)</label>
              <select
                name="uf"
                id="uf"
                value={selectedUf}
                onChange={handleSelectUf}
              >
                <option value="0">Selecione uma UF</option>
                {ufs.map(uf => {
                  return (
                    <option key={uf} value={uf}>{uf}</option>
                  );
                })}
              </select>
            </div>
            <div className="field">
              <label htmlFor="city">Cidade</label>
              <select 
                name="city"
                id="city"
                value={selectedCity}
                onChange={handleSelectCity}
              >
                <option value="0">Selecione uma Cidade</option>
                  {cities.map(city => {
                  return (
                    <option value={city} key={city}>{city}</option>
                  );
                })}
              </select>
            </div>
          </div>
          <Map center={initialPosition} zoom={11} >
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {points.map(point => {
              return (
                <Marker
                  key={point.id} 
                  position={[point.latitude,point.longitude]} 
                >
                  <Popup >
                    <div className="mapMarkerContainer">
                      <img className="mapImg" src={point.image_url} alt={point.name}/>
                      <Link to={`/point-detail/${point.id}`}>
                        {point.name}
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
            
            
          </Map>
          <legend>
            <h2>Ítens de Coleta</h2>
            <span>Selecione um ou mais itens abaixo para buscar os pontos</span>
          </legend>

          <ul className="items-grid">
            {items.map(item => {
              return (
                <li
                  key={item.id}
                  onClick={() => handleSelectItem(item.id)}
                  className={selectedItems.includes(item.id) ? 'selected' : ''}
                >
                  <img src={item.image_url} alt={item.title}/>
                  <span>{item.title}</span>
                </li>
              );
            })}
          </ul>
        </fieldset>
        <fieldset>
          
        </fieldset>
        
      </div>
      
      
{
    //   <form onSubmit={handleSubmit}>
    //     <h1>Cadastro do<br/>ponto de coleta</h1>
        
    //     <Dropzone onFileUploaded={setSelectedFile}/>

    //     {/* Dados */}
    //     <fieldset>
    //       <legend>
    //         <h2>Dados</h2>
    //       </legend>
          
    //       <div className="field">
    //         <label htmlFor="name">Nome da entidade</label>
    //         <input
    //           type="text"
    //           name="name"
    //           id="name"
    //           onChange={handleInputChange}
    //         />
    //       </div>

    //       <div className="field-group">
    //         <div className="field">
    //           <label htmlFor="email">E-mail</label>
    //           <input
    //             type="email"
    //             name="email"
    //             id="email"
    //             onChange={handleInputChange}
    //           />
    //         </div>
    //         <div className="field">
    //           <label htmlFor="name">Whatsapp</label>
    //           <input
    //             type="number"
    //             name="whatsapp"
    //             id="whatsapp"
    //             onChange={handleInputChange}
    //           />
    //         </div>
    //       </div>
    //     </fieldset>

    //     {/* Endereço */}
    //     <fieldset>
    //       <legend>
    //         <h2>Endereço</h2>
    //         <span>Selecione o endereço no mapa</span>
    //       </legend>

    //       <Map center={initialPosition} zoom={11} onClick={handleMapClick}>
    //         <TileLayer
    //           attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    //           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    //         />
    //         <Marker position={selectedPosition} />
    //       </Map>

    //       <div className="field-group">
    //         <div className="field">
    //           <label htmlFor="uf">Estado (UF)</label>
    //           <select
    //             name="uf"
    //             id="uf"
    //             value={selectedUf}
    //             onChange={handleSelectUf}
    //           >
    //             <option value="0">Selecione uma UF</option>
    //             {ufs.map(uf => {
    //               return (
    //                 <option key={uf} value={uf}>{uf}</option>
    //               );
    //             })}
    //            </select>
    //          </div>
    //          <div className="field">
    //           <label htmlFor="city">Cidade</label>
    //           <select 
    //             name="city"
    //             id="city"
    //             value={selectedCity}
    //             onChange={handleSelectCity}
    //           >
    //             <option value="0">Selecione uma Cidade</option>
    //               {cities.map(city => {
    //                return (
    //                 <option value={city} key={city}>{city}</option>
    //                );
    //              })}
    //            </select>
    //          </div>
    //       </div>
    //     </fieldset>

    //     {/* Itens coleta */}
    //     <fieldset>
    //       <legend>
    //         <h2>Ítens de Coleta</h2>
    //         <span>Selecione um ou mais itens abaixo</span>
    //       </legend>

    //       <ul className="items-grid">
    //         {items.map(item => {
    //           return (
    //             <li
    //               key={item.id}
    //               onClick={() => handleSelectItem(item.id)}
    //               className={selectedItems.includes(item.id) ? 'selected' : ''}
    //             >
    //               <img src={item.image_url} alt={item.title}/>
    //               <span>{item.title}</span>
    //             </li>
    //           );
    //         })}
    //       </ul>
    //     </fieldset>

    //     <button type="submit">
    //       Cadastrar ponto de coleta
    //     </button>
    //   </form>
    // 
}
    </div>
  );
};

export default FindPoint;