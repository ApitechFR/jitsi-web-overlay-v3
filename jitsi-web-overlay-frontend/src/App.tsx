import { useState, useEffect } from 'react';
import {
  Routes,
  Route,
  useNavigate,
} from 'react-router-dom';
import Mentionslegales from './pages/MentionsLegales/MentionsLegales.md';
import MentionslegalesVisioByApitech from './pages/staticPagesBuilder/MentionsLegales.md';
import StaticPagesBuilder from './pages/staticPagesBuilder/StaticPagesBuilder';
import BrowserTestJoona from './pages/browserTestJoona/BrowserTestJoona';
import LoginCallback from './pages/login/LoginCallback';
import LogoutCallback from './pages/login/LogoutCallback';
import Error from './pages/Error/Error';
import MuiDsfrThemeProvider from '@codegouvfr/react-dsfr/mui';
import WebinarInvitePage from './pages/webinar/WebinarInvitePage';
import Profile from './pages/Profile/Profile';
import Dashboard from './pages/Dashboard/Dashboard';
import LayoutJoona from './components/Layout/LayoutJoona';
import HomeJoona from './pages/Home/HomeJoona';
import JitsiMeet from './pages/Jitsi_meet/jitsi_meet';
import Admin from './pages/Admin/Admin';
import FeedbackJoona from './pages/Feedback/FeedbackJoona';
import ReplayList from './pages/ReplayList/ReplayList';
import ReplayListGrouped from './pages/ReplayList/ReplayListGrouped';
import PrivateRoute from './auth/PrivateRoute';
import AdminRoute from './auth/AdminRoute';
import RouteThemeController from './RouteThemeController';
import api from './axios/axios';
import { DashboardService } from './api/services/dashboard/dashboard.service';

/* === Import fichier de traduction === */
import './config/i18n';

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

  const cfg = useRuntimeConfig();

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

  /* === LIT LA CONFIG RUNTIME AU LIEU DE import.meta.env === */

  const AppTemplate = (cfg.VITE_APP_TEMPLATE as string) || 'joona';

  useEffect(() => {
    if (cfg?.VITE_APP_TITLE) {
      document.title = cfg.VITE_APP_TITLE;
    }
    if (cfg?.VITE_APP_FAVICON_URL) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        (link as HTMLLinkElement).rel = 'icon';
        document.head.appendChild(link);
      }
      (link as HTMLLinkElement).href = cfg.VITE_APP_FAVICON_URL;
    }
  }, [cfg?.VITE_APP_TITLE, cfg?.VITE_APP_FAVICON_URL]);

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
    if (globalThis.location.pathname.includes("/browser_test")) {
      document.body.classList.add("no-iframe-style");
    } else {
      document.body.classList.remove("no-iframe-style");
    }
    const fetchStats = async () => {
      try {
        const res = await DashboardService.fetchRealtimeStats();
        setConferenceNumber(res.conf || 0);
        setparticipantsNumber(res.part || 0);

      } catch (error: any) {
        setError({
          message: 'erreur: les statistiques ne sont pas récupérables',
          error: { status: '500', stack: error?.stack || '' },
        });
      }
    };
    fetchStats();
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
        <>
          <Route path="/webinar/invite/:token" element={<WebinarInvitePage />} />
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
                  setConferenceName={setRoomName}
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
            <Route path="visioreplay/:conference_uid" element={<PrivateRoute><ReplayList /></PrivateRoute>} />

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
            <Route path="browser_test" element={<BrowserTestJoona />} />
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

        {AppTemplate === 'webconf' && (
          <>
            <Route path="error" element={<Error error={error} />} />
            <Route
              path="mentionslegales"
              element={
                <StaticPagesBuilder
                  markDown={Mentionslegales}
                  contentTable={true}
                />
              }
            />
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