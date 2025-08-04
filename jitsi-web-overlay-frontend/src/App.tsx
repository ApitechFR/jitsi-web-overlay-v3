import Home from './pages/home/Home';
import Layout from './components/layout/Layout';
import { useState, useEffect } from 'react';
import { logDebug } from './utils/logDebug';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import FAQ from './pages/FAQ/FAQ.md';
import DonneesPerso from './pages/DonneesPerso/DonneesPerso.md';
import Contact from './pages/Contact/Contact.md';
import Cgu from './pages/Cgu/Cgu.md';
import Apropos from './pages/Apropos/Apropos.md';
import Accessibilite from './pages/Accessibilite/Accessibilite.md';
import Mentionslegales from './pages/MentionsLegales/MentionsLegales.md';
import StaticPagesBuilder from './pages/staticPagesBuilder/StaticPagesBuilder';
import Feedback from './pages/feedback/Feedback';
import BrowserTest from './pages/browserTest/BrowserTest';
import api from './axios/axios';
import LoginCallback from './pages/login/LoginCallback';
import LogoutCallback from './pages/login/LogoutCallback';
import Error from './pages/Error/Error';
import MuiDsfrThemeProvider from '@codegouvfr/react-dsfr/mui';
import PlanDuSite from './pages/PlanDuSite/PlanDuSite';
import jwtDecode from 'jwt-decode';

import Profile from './pages/joona/Profile/Profile';
import Dashboard from './pages/joona/Dashboard/Dashboard';
import LayoutJoona from './components/joona/layout/LayoutJoona';
import HomeJoona from './pages/joona/home/HomeJoona';
import JitsiMeet from './pages/joona/jitsi_meet/jitsi_meet';
import JitsiMeetWrapper from './JitsiMeetWrapper';
import Admin from './pages/joona/Admin/Admin';

import FeedbackJoona from './pages/joona/Feedback/FeedbackJoona';

type errorObj = {
  message: string;
  error: {
    status: string;
    stack: string;
  };
};

interface JwtPayload {
  exp: number;
}

function App() {
  const [roomName, setRoomName] = useState('');
  const [jwt, setJwt] = useState<string | undefined>(undefined);
  const [error, setError] = useState<errorObj>({
    message: "la page que vous demandez n'existe pas",
    error: { status: '404', stack: '' },
  });
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isWhitelisted, setIsWhitelisted] = useState<boolean | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [conferenceNumber, setConferenceNumber] = useState(0);
  const [participantsNumber, setparticipantsNumber] = useState(0);

  const AppTemplate = import.meta.env.VITE_APP_TEMPLATE || 'joona';

  const sendEmail = (roomName: string) => {
    api
      .post('conference/create/byemail', { roomName, email: email })
      .then(res => {
        if (res.data.error) {
          setError({
            message: "la page que vous demandez n'existe pas",
            error: { status: '404', stack: '' },
          });
          navigate('/error');
        } else {
          setIsWhitelisted(res.data.isWhitelisted);
        }
      })
      .catch(error => {
        if (error.response) {
          setIsWhitelisted(false);
        } else {
          if (error.request) {
            setError({
              message: "la page que vous demandez n'existe pas",
              error: { status: '404', stack: '' },
            });
            navigate('/error');
          } else {
            setError({
              message: "la page que vous demandez n'existe pas",
              error: { status: '500', stack: '' },
            });
            navigate('/error');
          }
        }
      });
  };

  const verifyAccessToken = () => {
    const accessToken = localStorage.getItem('auth');
    if (accessToken && accessToken !== 'false') {
      try {
        const { exp } = jwtDecode(accessToken) as JwtPayload;
        if (Date.now() <= exp * 1000) {
          setAuthenticated(true);
          return;
        }
      } catch (e) {
        logDebug('Erreur de décodage du JWT', e);
      }
    }

    // Si le token localStorage est à 'false', on ne tente pas de refresh
    if (!accessToken || accessToken === 'false') {
      setAuthenticated(false);
      return;
    }

    // Token invalide → tentative de refresh
    api
      .get('/authentication/refreshToken', { withCredentials: true })
      .then(res => {
        localStorage.setItem('auth', res.data.accessToken);
        setAuthenticated(true);
      })
      .catch(err => {
        localStorage.setItem('auth', 'false');
        setAuthenticated(false);
        // Bloque la redirection automatique OIDC, affiche une erreur
        setError({
          message: "Vous n'êtes pas authentifié. Veuillez vous connecter ",
          error: { status: '401', stack: '' },
        });
      });
  };

  useEffect(() => {
    //if (location.pathname !== '/login_callback' && location.pathname !== '/') {
    if (location.pathname !== '/login_callback') {
      verifyAccessToken();
      const intervalId = setInterval(verifyAccessToken, 1000 * 3600);
      return () => clearInterval(intervalId);
    }
  }, []);

  useEffect(() => {
    api
      .get('/stats/homePage')
      .then(res => {
        if (!res.data.authenticated) {
          // setAuthenticated(false);
        }
        setConferenceNumber(res.data.conf);
        setparticipantsNumber(res.data.part);
      })
      .catch(() => {
        setError({
          message: 'erreur: les statistiques ne sont pas récupérables',
          error: { status: '500', stack: '' },
        });
      });
  }, []);

  const joinConference = () => {
    api
      .get(`/${roomName}`)
      .then(res => {
        if (res.data.error) {
          setError({
            message: "la page que vous demandez n'existe pas",
            error: { status: '404', stack: '' },
          });
          navigate('/error');
        } else {
          setRoomName(roomName);
          setJwt(res.data.jwt);
          return res;
        }
      })
      .then(res => {
        if (res?.data) {
          if (res.data.jwt) {
            setJwt(res.data.jwt);
            return navigate(`/${res.data.roomName}`, {
              replace: true,
            });
          } else if (!res.data.error && !res.data.login) {
            setJwt(undefined);
            return navigate(`/${roomName}`);
          } else if (res.data.login) {
            setError({
              message: "Vous n'etes pas authentifié.",
              error: { status: '404', stack: '' },
            });
            return navigate('/error');
          }
        }
      })
      .catch(error => {
        setError({
          message: "la page que vous demandez n'existe pas",
          error: { status: error?.response?.status || '500', stack: '' },
        });
        navigate('/error');
      });
  };
  return (
    <MuiDsfrThemeProvider>
      <Routes>
        {AppTemplate === 'joona' && (
          <>
            <Route path=":roomName" element={<JitsiMeet />} />
            <Route
              path="/"
              element={
                <LayoutJoona
                  authenticated={authenticated}
                  setAuthenticated={setAuthenticated}
                  setError={setError}
                />
              }
            >
              <Route
                index
                element={
                  <HomeJoona
                    roomName={roomName}
                    setRoomName={setRoomName}
                    setIsWhitelisted={setIsWhitelisted}
                    isWhitelisted={isWhitelisted}
                    email={email}
                    setEmail={setEmail}
                    sendEmail={sendEmail}
                    joinConference={joinConference}
                    authenticated={authenticated}
                    conferenceNumber={conferenceNumber}
                    participantNumber={participantsNumber}
                  />
                }
              />
              <Route path="profile" element={<Profile />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="/logout/callback" element={<LogoutCallback />} />

              <Route
                path="/login_callback"
                element={
                  <LoginCallback
                    setAuthenticated={setAuthenticated}
                    setError={setError}
                  />
                }
              />
              <Route
                path="/login/callback"
                element={
                  <LoginCallback
                    setAuthenticated={setAuthenticated}
                    setError={setError}
                  />
                }
              />
            </Route>
              <Route
              path="/login_callback"
              element={
                <LoginCallback
                  setAuthenticated={setAuthenticated}
                  setError={setError}
                />
              }
            />
          </>
        )}
        {AppTemplate === 'webconf' && (
          <>
            <Route
              path=":roomName"
              element={
                <JitsiMeetWrapper
                  joinConference={joinConference}
                  setError={setError}
                  setRoomName={setRoomName}
                  jwt={jwt}
                />
              }
            />
            <Route
              path="/login_callback"
              element={
                <LoginCallback
                  setAuthenticated={setAuthenticated}
                  setError={setError}
                />
              }
            />
            <Route
              path="/login/callback"
              element={
                <LoginCallback
                  setAuthenticated={setAuthenticated}
                  setError={setError}
                />
              }
            />
            {/* <Route
              path="/authentication/logout_callback"
              element={
                <LogoutCallback
                // setAuthenticated={setAuthenticated}
                //setError={setError}
                />
              }
            /> */}
            <Route path="/logout/callback" element={<LogoutCallback />} />

            <Route
              path="/"
              element={
                <Layout
                  authenticated={authenticated}
                  setAuthenticated={setAuthenticated}
                  setError={setError}
                />
              }
            >
              <Route
                index
                element={
                  <Home
                    roomName={roomName}
                    setRoomName={setRoomName}
                    setIsWhitelisted={setIsWhitelisted}
                    isWhitelisted={isWhitelisted}
                    email={email}
                    setEmail={setEmail}
                    sendEmail={sendEmail}
                    joinConference={joinConference}
                    authenticated={authenticated}
                    conferenceNumber={conferenceNumber}
                    participantNumber={participantsNumber}
                  />
                }
              />
              <Route
                path="/wce-api/*"
                element={
                  <Navigate
                    to={`/${import.meta.env.VITE_API_URL}`}
                    replace={true}
                  />
                }
              />
              <Route path="error" element={<Error error={error} />} />
              <Route
                path="feedback"
                element={<Feedback setError={setError} />}
              />
              <Route path="browser_test" element={<BrowserTest />} />
              <Route
                path="faq"
                element={
                  <StaticPagesBuilder markDown={FAQ} contentTable={true} />
                }
              />
              <Route
                path="donneespersonnelles"
                element={
                  <StaticPagesBuilder
                    markDown={DonneesPerso}
                    contentTable={true}
                  />
                }
              />
              <Route
                path="contact"
                element={
                  <StaticPagesBuilder markDown={Contact} contentTable={false} />
                }
              />
              <Route
                path="apropos"
                element={
                  <StaticPagesBuilder markDown={Apropos} contentTable={true} />
                }
              />
              <Route
                path="cgu"
                element={
                  <StaticPagesBuilder markDown={Cgu} contentTable={true} />
                }
              />
              <Route
                path="accessibilite"
                element={
                  <StaticPagesBuilder
                    markDown={Accessibilite}
                    contentTable={true}
                  />
                }
              />
              <Route
                path="mentionslegales"
                element={
                  <StaticPagesBuilder
                    markDown={Mentionslegales}
                    contentTable={true}
                  />
                }
              />
              <Route path="plan-du-site" element={<PlanDuSite />} />
            </Route>
          </>
        )}
      </Routes>
    </MuiDsfrThemeProvider>
  );
}

export default App;
