import { Input } from "@apitechfr/react-dsapitech/Input";
import { Breadcrumb } from "@apitechfr/react-dsapitech/Breadcrumb";
import { Tag } from "@apitechfr/react-dsapitech/Tag"

import styles from './Profile.module.css';
import { useState, useEffect } from 'react';
import { decodeJwt } from '../../../utils/decodeJwt';

interface User {
  nom?: string;
  lastName?: string;
  family_name?: string;
  prenom?: string;
  firstName?: string;
  given_name?: string;
  email?: string;
  isAdmin?: boolean;
  admin?: boolean;
}

function Profile() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const auth = localStorage.getItem('auth');
    if (auth) {
      const decoded = decodeJwt(auth);
      let userInfos: User = decoded;
      if (decoded.idToken && typeof decoded.idToken === 'string') {
        userInfos = decodeJwt(decoded.idToken) as User;
      }
      const nomValue =
        userInfos.nom || userInfos.lastName || userInfos.family_name || '';
      setNom(nomValue);
      const prenomValue =
        userInfos.prenom || userInfos.firstName || userInfos.given_name || '';
      setPrenom(prenomValue);
      setEmail(userInfos.email || '');
      setIsAdmin(Boolean(userInfos.isAdmin || userInfos.admin));
    }
  }, []);

  return (
    <div className={styles.content}>
      <Breadcrumb
        currentPageLabel="Mon compte"
        homeLinkProps={{
          href: '/',
        }}
        segments={[]}
      />
      <div className={styles.titleBlock}>
        <h1>Mon compte</h1>
        {isAdmin && (
          <div>
            <Tag dismissible className={styles.adminTag}>
              Administrateur
            </Tag>
          </div>
        )}
      </div>
      <div className={styles.inputSection}>
        <Input disabled label="Nom" nativeInputProps={{ value: nom }} />

        <Input disabled label="Prénom" nativeInputProps={{ value: prenom }} />

        <Input disabled label="Email" nativeInputProps={{ value: email }} />
      </div>
    </div>
  );
}

export default Profile;
