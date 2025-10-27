import { useState, MouseEventHandler, MouseEvent } from 'react';
import HomeForm from './HomeForm';
import HomeSlider from './HomeSlider';
import styles from './Home.module.css';

interface AuthModalProps {
  roomName: string;
  email: string;
  isWhitelisted: boolean | null;
  setEmail: (mail: string) => void;
  sendEmail: (mail: string) => void;
  setIsWhitelisted: (e: any) => void;
  setRoomName: (e: any) => void;
  joinConference: () => void;
  authenticated: boolean | null;
  conferenceNumber: number;
  participantNumber: number;
}

function Home(props: AuthModalProps) {
  const [buttons, setButtons] = useState<boolean>(false);
  return (
    <div className={styles.homeContainer}>
      <div
        className={styles.home}
        onClick={
          ((event: MouseEvent) => {
            const div = event.currentTarget;
            const plusButton = div.querySelector('#plusButton');
            const copyButton = div.querySelector('#copyButton');
            const calendarButton = div.querySelector('#calendarButton');
            const calendar = document.querySelector('#Calendar');
            if (
              event.target !== plusButton &&
              event.target !== copyButton &&
              event.target !== calendarButton &&
              !calendar?.contains(event.target as any)
            ) {
              setButtons(false);
            }
          }) as MouseEventHandler<HTMLDivElement>
        }
      >
        <HomeForm {...props} setButtons={setButtons} buttons={buttons} />
        <HomeSlider />
      </div>
    </div>
  );
}

export default Home;
