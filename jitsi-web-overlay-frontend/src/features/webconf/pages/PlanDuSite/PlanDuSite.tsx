import { Link } from 'react-router-dom';
import styles from './PlanDuSite.module.css';

export default function PlanDuSite() {
  return (
    <div className={styles.rootDiv}>
      <h1>Plan du site</h1>
      <h6>
        <Link className={styles['flex-item']} to={'/cgu'}>
          Conditions générales d'utilisation
        </Link>
      </h6>
      <h6>
        <Link className={styles['flex-item']} to={'/accessibilite'}>
          Accessibilité
        </Link>
      </h6>
      <h6>
        <Link className={styles['flex-item']} to={'/apropos'}>
          À propos
        </Link>
      </h6>
      <h6>
        <Link className={styles['flex-item']} to={'/donneespersonnelles'}>
          Données personnelles
        </Link>
      </h6>
      <h6>
        <Link className={styles['flex-item']} to={'/faq'}>
          Foire aux questions
        </Link>
      </h6>
      <h6>
        <Link className={styles['flex-item']} to={'/mentionslegales'}>
          Mentions légales
        </Link>
      </h6>
    </div>
  );
}
