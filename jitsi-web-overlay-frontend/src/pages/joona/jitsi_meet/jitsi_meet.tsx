import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { validateRoomName } from '../../../utils/roomName';
import JitsiMeetWrapper from './JitsiMeetWrapper';

export default function JitsiMeet() {
  const { roomName } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (roomName === 'error') {
      navigate('/error'); 
      return;
    }
    if (roomName && !validateRoomName(roomName)) {
      Swal.fire({
        title: 'Erreur',
        text: `Le nom de la conférence ${roomName} n'est pas valide.`,
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        showCloseButton: true
      });
      navigate('/error');
    }
  }, [roomName, navigate]);

  return <JitsiMeetWrapper />;
}
