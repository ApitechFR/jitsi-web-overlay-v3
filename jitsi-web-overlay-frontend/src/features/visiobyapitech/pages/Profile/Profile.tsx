import { Input } from '@apitechfr/react-dsapitech/Input';
import { Breadcrumb } from '@apitechfr/react-dsapitech/Breadcrumb';
import { Tag } from '@apitechfr/react-dsapitech/Tag';
import styles from './Profile.module.css';
import { useAuth } from '../../../../auth/useAuth';
import { getUserFullName, getUserEmail, isUserAdmin } from '../../../../utils/user';

function Profile() {
  const { user } = useAuth();

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
        {isUserAdmin(user) && (
          <div>
            <Tag dismissible className={styles.adminTag}>
              Administrateur
            </Tag>
          </div>
        )}
      </div>
      <div className={styles.inputSection}>
        <Input disabled label="Nom complet" nativeInputProps={{ value: getUserFullName(user) }} />
        <Input disabled label="Email" nativeInputProps={{ value: getUserEmail(user) }} />
      </div>
    </div>
  );
}

export default Profile;
