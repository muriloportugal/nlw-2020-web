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
  const [initialPosition, setInitialPosition] = useState<[number,number]>([0,0]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
  });
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectedFile, setSelectedFile] = useState<File>();
  const [loading, setLoading] = useState(false);

  const history = useHistory();

  // Busca localização
  useEffect(() => {
    // Fazendo a chamada na api de geolocation da mozzila,
    // se utilizar o navigator.geolocation.getCurrentPosition()
    // ele vai tentar pegar da api do google, que agora é necessário uma
    // Key para que possa utilizar, e por isso no firefox o mapa nao iria funcionar
    axios.get('https://location.services.mozilla.com/v1/geolocate?key=test')
      .then(position => {
        const { lat, lng } = position.data.location;
        setInitialPosition([lat,lng]); 
      })
      .catch(error => console.log(error));
  }, []);
  
  // Busca os itens que podem ser reciclados e suas imagens
  useEffect(() => {
    api.get('/items').then(response => {
      setItems(response.data);
    })
  }, []);

  // Busca todos os estados da api do IBGE
  useEffect(() => {
    axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(response => {
        const ufInitials = response.data.map(uf => uf.sigla);
        setUfs(ufInitials);

      });
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
      });
  }, [selectedUf]);

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
      console.log(response);  
      setLoading(false);
      alert('Ponto de coleta criado');
      history.push('/');
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
            <label htmlFor="name">Nome da entidade</label>
            <input
              type="text"
              name="name"
              id="name"
              onChange={handleInputChange}
            />
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input
                type="email"
                name="email"
                id="email"
                onChange={handleInputChange}
              />
            </div>
            <div className="field">
              <label htmlFor="name">Whatsapp</label>
              <input
                type="text"
                name="whatsapp"
                id="whatsapp"
                onChange={handleInputChange}
              />
            </div>
          </div>
        </fieldset>

        {/* Endereço */}
        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço no mapa</span>
          </legend>

          <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={selectedPosition} />
          </Map>

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
        </fieldset>

        {/* Itens coleta */}
        <fieldset>
          <legend>
            <h2>Ítens de Coleta</h2>
            <span>Selecione um ou mais itens abaixo</span>
          </legend>

          <ul className="items-grid">
            {items.map(item => {
              console.log(item);
              return (
                // para poder enviar um parâmetro para a função precisa colocar
                // a mesma como sendo chamada por outra função, nesse caso uma
                // arrowfunction que chama handleSelectItem e esta recebe o id do item
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