import { Input } from '@apitechfr/react-dsapitech/Input';
import { Breadcrumb } from '@apitechfr/react-dsapitech/Breadcrumb';
import { Tag } from '@apitechfr/react-dsapitech/Tag';
import styles from './Profile.module.css';
import { useState, useEffect } from 'react';
import { fetchUserInfos, getUserFullName, getUserEmail, isUserAdmin, UserInfos } from '../../../utils/userInfos';

function Profile() {
  const [userInfos, setUserInfos] = useState<UserInfos | null>(null);

  useEffect(() => {
    fetchUserInfos().then(data => setUserInfos(data));
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
        {isUserAdmin(userInfos) && (
          <div>
            <Tag dismissible className={styles.adminTag}>
              Administrateur
            </Tag>
          </div>
        )}
      </div>
      <div className={styles.inputSection}>
        <Input disabled label="Nom complet" nativeInputProps={{ value: getUserFullName(userInfos) }} />
        <Input disabled label="Email" nativeInputProps={{ value: getUserEmail(userInfos) }} />
      </div>
    </div>
  );
}

export default Profile;
