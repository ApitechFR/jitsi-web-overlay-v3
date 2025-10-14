import Home from './pages/home/Home';
import Layout from './components/layout/Layout';
import { useState, useEffect } from 'react';
import {
  Routes,
  Route,
  useNavigate,
  Navigate,
  useLocation,
} from 'react-router-dom';
import FAQ from './pages/FAQ/FAQ.md';
import DonneesPerso from './pages/DonneesPerso/DonneesPerso.md';
import Contact from './pages/Contact/Contact.md';
import Cgu from './pages/Cgu/Cgu.md';
import Apropos from './pages/Apropos/Apropos.md';
import Accessibilite from './pages/Accessibilite/Accessibilite.md';
import Mentionslegales from './pages/MentionsLegales/MentionsLegales.md';
import MentionslegalesVisioByApitech from './pages/MentionsLegales/MentionsLegalesVisioByApitech.md';
import StaticPagesBuilder from './pages/staticPagesBuilder/StaticPagesBuilder';
import Feedback from './pages/feedback/Feedback';
import BrowserTest from './pages/browserTest/BrowserTest';
import LoginCallback from './pages/login/LoginCallback';
import LogoutCallback from './pages/login/LogoutCallback';
import Error from './pages/Error/Error';
import MuiDsfrThemeProvider from '@codegouvfr/react-dsfr/mui';
import PlanDuSite from './pages/PlanDuSite/PlanDuSite';
import Profile from './pages/joona/Profile/Profile';
import Dashboard from './pages/joona/Dashboard/Dashboard';
import LayoutJoona from './components/joona/layout/LayoutJoona';
import HomeJoona from './pages/joona/home/HomeJoona';
import JitsiMeet from './pages/joona/jitsi_meet/jitsi_meet';
import Admin from './pages/joona/Admin/Admin';
import FeedbackJoona from './pages/joona/Feedback/FeedbackJoona';
import ReplayList from './pages/joona/replayList/ReplayList';
import ReplayListGrouped from './pages/joona/replayList/ReplayListGrouped';
import PrivateRoute from './auth/PrivateRoute';
import AdminRoute from './auth/AdminRoute';
import { useAuth } from './auth/useAuth';
import RouteThemeController from './RouteThemeController';

import { useApi, ConferenceService, StatsService } from '@/api';

type errorObj = {
  message: string;
  error: {
    status: string;
    stack: string;
  };
};


function App() {
  const [confName, setConfName] = useState('');
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

  const AppTemplate = import.meta.env.VITE_APP_TEMPLATE || 'joona';
  const { authenticated } = useAuth();


  const { run: createByEmail } = useApi(ConferenceService.createByEmail);
  const { run: joinConf } = useApi(ConferenceService.join);
  const { run: getHomeStats } = useApi(StatsService.homePage);

  const sendEmail = async (name: string) => {
    try {
      const res = await createByEmail(name, email);
      if (res?.error) {
        setError({ message: "la page que vous demandez n'existe pas", error: { status: '404', stack: '' } });
        navigate('/error');
      } else {
        setIsWhitelisted(res.isWhitelisted);
      }
    } catch (e: any) {
      if (e?.status) {
        setIsWhitelisted(false);
      } else if (e?.request) {
        setError({ message: e?.message || "la page que vous demandez n'existe pas", error: { status: e?.status || '404', stack: '' } });
        navigate('/error');
      } else {
        setError({ message: e?.message || "la page que vous demandez n'existe pas", error: { status: e?.status || '500', stack: '' } });
        navigate('/error');
      }
    }
  };


  useEffect(() => {
    if (AppTemplate === 'webconf') {
      getHomeStats()
        .then(({ conf, part }) => {
          setConferenceNumber(conf);
          setparticipantsNumber(part);
        })
        .catch(() => {
          setError({
            message: 'erreur: les statistiques ne sont pas récupérables',
            error: { status: '500', stack: '' },
          });
        });
    }
  }, [AppTemplate, getHomeStats]);

  const joinConference = async () => {
    try {
      const res = await joinConf(confName);
      if (res?.error) {
        setError({
          message: "la page que vous demandez n'existe pas",
          error: { status: '404', stack: '' },
        });
        navigate('/error');
        return;
      }
      setConfName(confName);
      setJwt(res.jwt);

      if (res.jwt) {
        navigate(`/${res.confName ?? confName}`, { replace: true });
      } else if (!res.login) {
        setJwt(undefined);
        navigate(`/${confName}`);
      } else {
        setError({ message: "Vous n'etes pas authentifié.", error: { status: '404', stack: '' } });
        navigate('/error');
      }
    } catch (err: any) {
      setError({
        message: "la page que vous demandez n'existe pas",
        error: { status: err?.response?.status || '500', stack: '' },
      });
      navigate('/error');
    }

  };

  return (
    <MuiDsfrThemeProvider>
      <RouteThemeController />
      <Routes>
        {AppTemplate === 'joona' && (
          <>
            <Route
              path=":conferenceName"
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
            <Route
              path="/login/callback"
              element={<LoginCallback />}
            />
            <Route path="/" element={<LayoutJoona />}>
              <Route
                index
                element={
                  <HomeJoona
                    conferenceName={confName}
                    setconferenceName={setConfName}
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
              <Route
                path="dashboard"
                element={
                  <AdminRoute>
                    <Dashboard />
                  </AdminRoute>
                }
              />
              <Route path="visioreplay/:conference_uid" element={<ReplayList />} />
              <Route path="replays" element={<AdminRoute><ReplayListGrouped /></AdminRoute>} />
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
                    roomName={confName}
                    setRoomName={setConfName}
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
                      import.meta.env.VITE_API_URL?.startsWith('/')
                        ? import.meta.env.VITE_API_URL
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

export default App;