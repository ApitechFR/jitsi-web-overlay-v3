import styles from './Error.module.css';

type errorObj = {
  error: {
    message: string;
    error: {
      status: string;
      stack: string;
    };
  };
};

export default function Error({ error }: errorObj) {
  const render = () => {
    if (error.error.status === '404') {
      return (
        <main role="main" id="content">
          {' '}
          <div className="fr-container">
            {' '}
            <div className="fr-my-7w fr-mt-md-12w fr-mb-md-10w fr-grid-row fr-grid-row--gutters fr-grid-row--middle fr-grid-row--center">
              {' '}
              <div className="fr-py-0 fr-col-12 fr-col-md-6">
                {' '}
                <h1>Page non trouvée</h1> <h3>{error.message}</h3>
                <p className="fr-text--sm fr-mb-3w">Erreur 404</p>{' '}
                <p className="fr-text--lead fr-mb-3w">
                  La page que vous cherchez est introuvable. Excusez-nous pour
                  la gène occasionnée.
                </p>{' '}
                <p className="fr-text--sm fr-mb-5w">
                  {' '}
                  Si vous avez tapé l'adresse web dans le navigateur, vérifiez
                  qu'elle est correcte. La page n’est peut-être plus disponible.
                  Dans ce cas, pour continuer votre visite vous pouvez consulter
                  notre page d’accueil, ou effectuer une recherche avec notre
                  moteur de recherche en haut de page. Sinon contactez-nous pour
                  que l’on puisse vous rediriger vers la bonne information.{' '}
                </p>{' '}
                <ul className="fr-btns-group fr-btns-group--inline-md">
                  {' '}
                  <li>
                    {' '}
                    <a className="fr-btn" href="/">
                      {' '}
                      Page d'accueil{' '}
                    </a>{' '}
                  </li>{' '}
                  <li>
                    {' '}
                    <a className="fr-btn fr-btn--secondary" href="/contact">
                      {' '}
                      Contactez-nous{' '}
                    </a>{' '}
                  </li>{' '}
                </ul>{' '}
              </div>{' '}
              <div className="fr-col-12 fr-col-md-3 fr-col-offset-md-1 fr-px-6w fr-px-md-0 fr-py-0">
                {' '}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="fr-responsive-img fr-artwork"
                  aria-hidden="true"
                  width="160"
                  height="200"
                  viewBox="0 0 160 200"
                >
                  {' '}
                  <use
                    className="fr-artwork-motif"
                    href="../../../../../dist/artwork/background/ovoid.svg#artwork-motif"
                  ></use>{' '}
                  <use
                    className="fr-artwork-background"
                    href="../../../../../dist/artwork/background/ovoid.svg#artwork-background"
                  ></use>{' '}
                  <g transform="translate(40, 60)">
                    {' '}
                    <use
                      className="fr-artwork-decorative"
                      href="../../../../../dist/artwork/pictograms/system/technical-error.svg#artwork-decorative"
                    ></use>{' '}
                    <use
                      className="fr-artwork-minor"
                      href="../../../../../dist/artwork/pictograms/system/technical-error.svg#artwork-minor"
                    ></use>{' '}
                    <use
                      className="fr-artwork-major"
                      href="../../../../../dist/artwork/pictograms/system/technical-error.svg#artwork-major"
                    ></use>{' '}
                  </g>{' '}
                </svg>{' '}
              </div>{' '}
            </div>{' '}
          </div>
        </main>
      );
    }
    if (error.error.status === '500') {
      return (
        <main role="main" id="content">
          {' '}
          <div className="fr-container">
            {' '}
            <div className="fr-my-7w fr-mt-md-12w fr-mb-md-10w fr-grid-row fr-grid-row--gutters fr-grid-row--middle fr-grid-row--center">
              {' '}
              <div className="fr-py-0 fr-col-12 fr-col-md-6">
                {' '}
                <h1>Erreur inattendue</h1>{' '}
                <p className="fr-text--sm fr-mb-3w">Erreur 500</p>{' '}
                <p className="fr-text--lead fr-mb-3w">
                  Essayez de rafraichir la page ou bien ressayez plus tard.
                </p>{' '}
                <p className="fr-text--sm fr-mb-5w">
                  {' '}
                  Désolé, le service rencontre un problème, nous travaillons
                  pour le résoudre le plus rapidement possible.{' '}
                </p>{' '}
                <ul className="fr-btns-group fr-btns-group--inline-md">
                  {' '}
                  <li>
                    {' '}
                    <a className="fr-btn fr-btn--secondary" href="/contact">
                      {' '}
                      Contactez-nous{' '}
                    </a>{' '}
                  </li>{' '}
                </ul>{' '}
              </div>{' '}
              <div className="fr-col-12 fr-col-md-3 fr-col-offset-md-1 fr-px-6w fr-px-md-0 fr-py-0">
                {' '}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="fr-responsive-img fr-artwork"
                  aria-hidden="true"
                  width="160"
                  height="200"
                  viewBox="0 0 160 200"
                >
                  {' '}
                  <use
                    className="fr-artwork-motif"
                    href="../../../../../dist/artwork/background/ovoid.svg#artwork-motif"
                  ></use>{' '}
                  <use
                    className="fr-artwork-background"
                    href="../../../../../dist/artwork/background/ovoid.svg#artwork-background"
                  ></use>{' '}
                  <g transform="translate(40, 60)">
                    {' '}
                    <use
                      className="fr-artwork-decorative"
                      href="../../../../../dist/artwork/pictograms/system/technical-error.svg#artwork-decorative"
                    ></use>{' '}
                    <use
                      className="fr-artwork-minor"
                      href="../../../../../dist/artwork/pictograms/system/technical-error.svg#artwork-minor"
                    ></use>{' '}
                    <use
                      className="fr-artwork-major"
                      href="../../../../../dist/artwork/pictograms/system/technical-error.svg#artwork-major"
                    ></use>{' '}
                  </g>{' '}
                </svg>{' '}
              </div>{' '}
            </div>{' '}
          </div>
        </main>
      );
    }
  };
  return <div className={styles.home}>{render()}</div>;
}
