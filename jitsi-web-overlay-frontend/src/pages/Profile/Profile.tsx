import { Input, Breadcrumb, Tag } from '@ds';
import { useTranslation } from 'react-i18next';
import styles from './Profile.module.css';
import { useAuth } from '@/auth/useAuth';
import { getUserFullName, getUserEmail, isUserAdmin } from '@/utils/user';

function Profile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const uid = user?.uid as string;

  return (
    <div className={styles.content}>
      <Breadcrumb
        currentPageLabel={t('header.account')}
        homeLinkProps={{
          href: '/',
        }}
        segments={[]}
      />
      <div className={styles.titleBlock}>
        <h1>{t('header.account')}</h1>
        {isUserAdmin(user) && (
          <div>
            <Tag dismissible className={styles.adminTag}>
              {t('profile.admin')}
            </Tag>
          </div>
        )}
      </div>
      <div className={styles.inputSection}>
        <Input disabled label={t('profile.id')} nativeInputProps={{ value: uid }} />
        <Input disabled label={t('profile.fullName')} nativeInputProps={{ value: getUserFullName(user) }} />
        <Input disabled label={t('profile.email')} nativeInputProps={{ value: getUserEmail(user) }} />
      </div>
    </div>
  );
}

export default Profile;
