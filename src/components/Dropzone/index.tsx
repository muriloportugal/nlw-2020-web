import React, { useCallback, useState } from 'react';
import {useDropzone} from 'react-dropzone';
import {FiUpload} from 'react-icons/fi';

import './styles.css'

interface Props {
  onFileUploaded: (file: File) => void;
}

// Recebe por parâmetro uma função, definimos ela na interface Props
// essa função esta vindo do arquivo CreatePoint onde passamos o setSelectedFile como parâmetro
const Dropzone: React.FC<Props> = ({ onFileUploaded }) => {

  const [selectedFileUrl, setSelectedFileUrl] = useState('');

  const onDrop = useCallback(acceptedFiles => {
    const file = acceptedFiles[0];
    const fileUrl = URL.createObjectURL(file);
    // Grava o estado de SelectedFileUrl para exibir depois na tela neste componente.
    setSelectedFileUrl(fileUrl);
    // Pega o arquivo que acabamos de receber no componente dropzone
    // e passa ele para o componente pai (nesse caso o CreatePoint)
    // atraves da função setSelectedFile que recebemos como parâmetro.
    onFileUploaded(file);

  }, [onFileUploaded])
  const {getRootProps, getInputProps} = useDropzone({
    onDrop,
    accept: 'image/*'
  })

  return (
    <div className='dropzone' {...getRootProps()}>
      <input {...getInputProps()} accept='image/*' />
      {
        selectedFileUrl 
          ? <img src={selectedFileUrl} alt='Point Thumbnail'/>
          :  (<p>
            <FiUpload />
            Imagem do estabelecimento
          </p>)
      }
    </div>
  )
}

export default Dropzone;