import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet';
import { LeafletMouseEvent } from 'leaflet';
import axios from 'axios';

import './styles.css';
import logo from '../../assets/logo.svg';
import api from '../../services/api';
import Dropzone from '../../components/Dropzone';
import Loading  from '../../components/Loading';

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

const CreatePoint = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [ufs, setUfs] = useState<string[]>([]);
  const [selectedUf, setSelectedUf] = useState('0');
  const [cities, setCities] = useState<string[]>([])
  const [selectedCity, setSelectedCity] = useState('0');
  const [selectedPosition, setSelectedPosition] = useState<[number,number]>([0,0]);
  const [initialPosition, setInitialPosition] = useState<[number,number]>([-23.5682032,-46.7194634]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
  });
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectedFile, setSelectedFile] = useState<File>();
  const [loading, setLoading] = useState(false);

  const history = useHistory();

    // Busca os itens que podem ser reciclados e suas imagens
    useEffect(() => {
      api.get('/items').then(response => {
        setItems(response.data);
        
      }).catch(error => {
        console.log(`Erro ao buscar itens recicláveis ${error}`);
      });
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

  // Busca latitude longitude para posicionar o mapa na cidade selecionada
  useEffect(() => {
    if(selectedCity !== '0'){
      const parsedCity = selectedCity.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      api.get('/location',{
        params: {
          city: parsedCity,
          uf: selectedUf
        }
      }).then(result => {
        const cityLocation = result.data[0];
        if(cityLocation){
          if(cityLocation.city === selectedCity)
          setInitialPosition(cityLocation.location);
        }
      });
    }    
  }, [cities, selectedUf, selectedCity])

  function handleSelectUf(event: ChangeEvent<HTMLSelectElement>) {
    const uf = event.target.value;
    setSelectedUf(uf);
  }

  function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
    const city = event.target.value;
    setSelectedCity(city);
  }

  function handleMapClick(event: LeafletMouseEvent) {
    setSelectedPosition([
      event.latlng.lat,
      event.latlng.lng,
    ]);
  }
  // Pega os valores dos input e armazena nos estados
  function handleInputChange(event: ChangeEvent<HTMLInputElement>){
    const {name, value} = event.target;
    setFormData({ ...formData, [name]: value});
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>){
    event.preventDefault();

    setLoading(true);
    const { name, email, whatsapp } = formData;
    const uf = selectedUf;
    const city = selectedCity;
    const [latitude, longitude] = selectedPosition;
    const items = selectedItems;
    
    const data = new FormData();

    
    data.append('name', name);
    data.append('email', email);
    data.append('whatsapp', whatsapp);
    data.append('city', city);
    data.append('uf', uf);
    data.append('latitude', String(latitude));
    data.append('longitude', String(longitude));
    data.append('items', items.join(','));
    if(selectedFile){
      data.append('image',selectedFile);
    }

    api.post('points', data)
    .then(response =>{  
      setLoading(false);
      alert('Ponto de coleta criado');
      history.push('/');
    })
    .catch(error => {
      setLoading(false);
      alert(`Erro ao tentar criar ponto de coleta.\n${JSON.stringify(error.response.data)}`)
    });
    
    
  }

  return (
    <div id="page-create-point">
      { loading && <Loading />}
      <header>
        <img src={logo} alt="Ecoleta"/>
        <Link to="/">
          <FiArrowLeft />
          Voltar para home
        </Link>
      </header>

      <form onSubmit={handleSubmit}>
        <h1>Cadastro do<br/>ponto de coleta</h1>
        
        <Dropzone onFileUploaded={setSelectedFile}/>

        {/* Dados */}
        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>
          
          <div className="field">
            <label htmlFor="name">Nome da entidade (Obrigatório)</label>
            <input
              type="text"
              name="name"
              id="name"
              required={true}
              onChange={handleInputChange}
            />
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="email">E-mail (Obrigatório)</label>
              <input
                type="email"
                name="email"
                id="email"
                required={true}
                onChange={handleInputChange}
              />
            </div>
            <div className="field">
              <label htmlFor="name">Whatsapp (Obrigatório)</label>
              <input
                type="number"
                name="whatsapp"
                id="whatsapp"
                required={true}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </fieldset>

        {/* Endereço */}
        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço no mapa (Obrigatório)</span>
          </legend>

          <Map center={initialPosition} zoom={11} onClick={handleMapClick}>
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={selectedPosition} />
          </Map>

          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado (UF) (Obrigatório)</label>
              <select
                name="uf"
                id="uf"
                value={selectedUf}
                required={true}
                onChange={handleSelectUf}
              >
                <option value="">Selecione uma UF</option>
                {ufs.map(uf => {
                  return (
                    <option key={uf} value={uf}>{uf}</option>
                  );
                })}
               </select>
             </div>
             <div className="field">
              <label htmlFor="city">Cidade (Obrigatório)</label>
              <select 
                name="city"
                id="city"
                value={selectedCity}
                required={true}
                onChange={handleSelectCity}
              >
                <option value="">Selecione uma Cidade </option>
                  {cities.map(city => {
                   return (
                    <option value={city} key={city}>{city}</option>
                   );
                 })}
               </select>
             </div>
          </div>
        </fieldset>

        {/* Itens coleta */}
        <fieldset>
          <legend>
            <h2>Ítens de Coleta</h2>
            <span>Selecione um ou mais itens abaixo (Obrigatório)</span>
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

        <button type="submit">
          Cadastrar ponto de coleta
        </button>
      </form>
    </div>
  );
};

export default CreatePoint;