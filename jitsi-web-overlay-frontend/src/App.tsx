import Home from './features/webconf/pages/home/Home';
import Layout from './features/webconf/components/layout/Layout';
import { useState, useEffect } from 'react';
import {
  Routes,
  Route,
  useNavigate,
  Navigate,
  useLocation,
} from 'react-router-dom';
import FAQ from './features/webconf/pages/FAQ/FAQ.md';
import DonneesPerso from './features/webconf/pages/donneesPerso/DonneesPerso.md';
import Contact from './features/webconf/pages/contact/Contact.md';
import Cgu from './features/webconf/pages/cgu/Cgu.md';
import Apropos from './features/webconf/pages/apropos/Apropos.md';
import Accessibilite from './features/webconf/pages/accessibilite/Accessibilite.md';
import Mentionslegales from './features/webconf/pages/mentionsLegales/MentionsLegales.md';
import MentionslegalesVisioByApitech from './features/visiobyapitech/pages/staticPagesBuilder/MentionsLegales.md';
import StaticPagesBuilder from './features/webconf/pages/staticPagesBuilder/StaticPagesBuilder';
import Feedback from "./features/webconf/pages/feedback/Feedback";
import BrowserTest from './features/webconf/pages/browserTest/BrowserTest';
import LoginCallback from './features/webconf/pages/login/LoginCallback';
import LogoutCallback from './features/webconf/pages/login/LogoutCallback';
import Error from './features/webconf/pages/error/Error';
import MuiDsfrThemeProvider from '@codegouvfr/react-dsfr/mui';
import PlanDuSite from './features/webconf/pages/planDuSite/PlanDuSite';
import Profile from './features/visiobyapitech/pages/profile/Profile';
import Dashboard from './features/visiobyapitech/pages/dashboard/Dashboard';
import LayoutJoona from './features/visiobyapitech/components/layout/LayoutJoona';
import HomeJoona from './features/visiobyapitech/pages/home/HomeJoona';
import JitsiMeet from './features/visiobyapitech/pages/jitsi_meet/Jitsi_meet';
import Admin from './features/visiobyapitech/pages/admin/Admin';
import FeedbackJoona from './features/visiobyapitech/pages/feedback/FeedbackJoona';
import ReplayList from './features/visiobyapitech/pages/replayList/ReplayList';
import ReplayListGrouped from './features/visiobyapitech/pages/replayList/ReplayListGrouped';
import PrivateRoute from './auth/PrivateRoute';
import AdminRoute from './auth/AdminRoute';
import { useAuth } from './auth/useAuth';
import RouteThemeController from './RouteThemeController';
import api from './axios/axios';



/* === AJOUTS pour config runtime === */
import { ConfigProvider, useRuntimeConfig } from './config/ConfigProvider';

type errorObj = {
  message: string;
  error: {
    status: string;
    stack: string;
  };
};


function AppInner() {
  const [roomName, setRoomName] = useState('');
  const [jwt, setJwt] = useState<string | undefined>(undefined);
  const [error, setError] = useState<errorObj>({
    message: "la page que vous demandez n'existe pas",
    error: { status: '404', stack: '' },
  });
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isWhitelisted, setIsWhitelisted] = useState<boolean | null>(null);
  const [conferenceNumber, setConferenceNumber] = useState(0);
  const [participantsNumber, setparticipantsNumber] = useState(0);

  const location = useLocation();
  const { authenticated } = useAuth();

  /* === LIT LA CONFIG RUNTIME AU LIEU DE import.meta.env === */
  const cfg = useRuntimeConfig();
  const AppTemplate = (cfg.VITE_APP_TEMPLATE as string) || 'joona';

  const sendEmail = (room: string) => {
    api
      .post('conference/create/byemail', { roomName: room, email })
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
      .catch(err => {
        if (err?.response) {
          setIsWhitelisted(false);
        } else if (err?.request) {
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
      });
  };

  useEffect(() => {
    if (AppTemplate === 'webconf') {
      api
        .get('/stats/homePage')
        .then(res => {
          setConferenceNumber(res.data.conf);
          setparticipantsNumber(res.data.part);
        })
        .catch(() => {
          setError({
            message: 'erreur: les statistiques ne sont pas récupérables',
            error: { status: '500', stack: '' },
          });
        });
    }
  }, [AppTemplate]);

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
            return navigate(`/${res.data.roomName}`, { replace: true });
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
      .catch(err => {
        setError({
          message: "la page que vous demandez n'existe pas",
          error: { status: err?.response?.status || '500', stack: '' },
        });
        navigate('/error');
      });
  };

  return (
    <MuiDsfrThemeProvider>
      <RouteThemeController />
      <Routes>
        {AppTemplate === 'joona' && (
          <>
            <Route
              path=":roomName"
              element={
                <PrivateRoute>
                  <JitsiMeet />
                </PrivateRoute>
              }
            />
            <Route path="/logout/callback" element={<LogoutCallback />} />
            <Route
              path="/login_callback"
              element={<LoginCallback />}
            />
            <Route path="/auth/logout" element={<LogoutCallback />} />
            <Route
              path="/login/callback"
              element={<LoginCallback />}
            />
            <Route path="/auth/callback" element={<LoginCallback />} />
            <Route path="/" element={<LayoutJoona />}>
              <Route
                index
                element={
                  <HomeJoona
                    conferenceName={roomName}
                    setconferenceName={setRoomName}
                    setIsWhitelisted={setIsWhitelisted}
                    isWhitelisted={isWhitelisted}
                    email={email}
                    setEmail={setEmail}
                    sendEmail={sendEmail}
                    joinConference={joinConference}
                    conferenceNumber={conferenceNumber}
                    participantNumber={participantsNumber}
                  />
                }
              />
              <Route
                path="profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route path="visioreplay/:conference_uid" element={<ReplayList />} />

              <Route
                path="replays"
                element={
                  <AdminRoute>
                    <ReplayListGrouped />
                  </AdminRoute>
                }
              />
              <Route
                path="dashboard"
                element={
                  <AdminRoute>
                    <Dashboard />
                  </AdminRoute>
                }
              />

              <Route
                path="admin"
                element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                }
              />
              <Route path="feedback" element={<FeedbackJoona />} />
              <Route
                path="mentionslegales"
                element={
                  <StaticPagesBuilder
                    markDown={MentionslegalesVisioByApitech}
                    contentTable={false}
                  />
                }
              />
            </Route>
          </>
        )}

        {AppTemplate === 'webconf' && (
          <>
            <Route
              path="/login_callback"
              element={<LoginCallback />}
            />
            <Route
              path="/login/callback"
              element={<LoginCallback />}
            />
            <Route path="/logout/callback" element={<LogoutCallback />} />

            <Route path="/" element={<Layout />}>
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
                    authenticated={!!authenticated}
                    conferenceNumber={conferenceNumber}
                    participantNumber={participantsNumber}
                  />
                }
              />

              {/* Si VITE_API_URL est un chemin relatif, on redirige ; sinon on revient à la home */}
              <Route
                path="/wce-api/*"
                element={
                  <Navigate
                    to={
                      cfg.VITE_API_URL?.startsWith('/')
                        ? cfg.VITE_API_URL
                        : '/'
                    }
                    replace
                  />
                }
              />

              <Route path="error" element={<Error error={error} />} />
              <Route path="feedback" element={<Feedback setError={setError} />} />
              <Route path="browser_test" element={<BrowserTest />} />
              <Route
                path="faq"
                element={<StaticPagesBuilder markDown={FAQ} contentTable={true} />}
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
export default function App() {
  return (
    <ConfigProvider>
      <AppInner />
    </ConfigProvider>
  );
}